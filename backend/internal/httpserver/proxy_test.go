package httpserver

import (
	"crypto/tls"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func proxyFixture(t *testing.T, trusted ...string) *Handler {
	t.Helper()
	h, err := New(Config{ContentDir: t.TempDir(), TrustedProxies: trusted})
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(h.Close)
	// A fixed budget makes isolation tests independent of elapsed wall time.
	h.limiter = newRateLimiter(2, 0)
	return h
}

func proxyRequest(h *Handler, peer string, forwarded ...string) *httptest.ResponseRecorder {
	r := httptest.NewRequest(http.MethodGet, "http://portfolio.example/api/health", nil)
	r.RemoteAddr = peer
	for _, value := range forwarded {
		r.Header.Add("X-Forwarded-For", value)
	}
	w := httptest.NewRecorder()
	h.ServeHTTP(w, r)
	return w
}

func TestProxyVisitorsHaveIndependentRateLimits(t *testing.T) {
	for _, peer := range []string{"127.0.0.1:48000", "[::1]:48000", "[::ffff:127.0.0.1]:48000"} {
		t.Run(peer, func(t *testing.T) {
			h := proxyFixture(t, "127.0.0.1", "::1")
			for i, want := range []int{200, 200, 429} {
				if got := proxyRequest(h, peer, "198.51.100.10").Code; got != want {
					t.Fatalf("visitor A request %d: got %d, want %d", i, got, want)
				}
			}
			if got := proxyRequest(h, peer, "203.0.113.20").Code; got != http.StatusOK {
				t.Fatalf("visitor B inherited visitor A's limit: %d", got)
			}
			if got := proxyRequest(h, peer, "203.0.113.99, 198.51.100.10").Code; got != http.StatusTooManyRequests {
				t.Fatalf("a forged prefix bypassed visitor A's limit: %d", got)
			}
		})
	}
}

func TestUntrustedConnectionsCannotBypassRateLimits(t *testing.T) {
	for _, trusted := range [][]string{nil, {"127.0.0.1/32", "::1/128"}} {
		h := proxyFixture(t, trusted...)
		for i, want := range []int{200, 200, 429} {
			if got := proxyRequest(h, "192.0.2.10:48000", fmt.Sprintf("198.51.100.%d", i)).Code; got != want {
				t.Fatalf("untrusted connection with config %v request %d: %d", trusted, i, got)
			}
		}
		if got := proxyRequest(h, "192.0.2.11:48000", "198.51.100.0").Code; got != http.StatusOK {
			t.Fatalf("a different direct client was blocked: %d", got)
		}
	}
}

func TestForwardedChainsPreserveVisitorIdentity(t *testing.T) {
	for _, test := range []struct {
		name          string
		first, second []string
	}{
		{"appended proxy", []string{"198.51.100.10, 10.0.0.2"}, []string{"203.0.113.99, 198.51.100.10, 10.0.0.3"}},
		{"multiple header lines", []string{"198.51.100.10", "10.0.0.2"}, []string{"203.0.113.99, 198.51.100.10", "10.0.0.3"}},
		{"untrusted middle hop", []string{"198.51.100.10, 192.0.2.50, 10.0.0.2"}, []string{"203.0.113.20, 192.0.2.50, 10.0.0.3"}},
		{"irrelevant malformed prefix", []string{"198.51.100.10, 10.0.0.2"}, []string{"garbage, 198.51.100.10, 10.0.0.3"}},
		{"mapped IPv4", []string{"198.51.100.10"}, []string{"::ffff:198.51.100.10"}},
		{"IPv6 spelling", []string{"2001:db8::10"}, []string{"2001:0db8:0:0:0:0:0:10"}},
		{"all hops trusted", []string{"10.0.0.2"}, []string{"10.0.0.2, 10.0.0.3"}},
	} {
		t.Run(test.name, func(t *testing.T) {
			h := proxyFixture(t, "127.0.0.1/32", "10.0.0.0/24")
			for i, want := range []int{200, 200, 429} {
				chain := test.first
				if i == 2 {
					chain = test.second
				}
				if got := proxyRequest(h, "127.0.0.1:48000", chain...).Code; got != want {
					t.Fatalf("request %d: got %d, want %d", i, got, want)
				}
			}
			if got := proxyRequest(h, "127.0.0.1:48000", "203.0.113.42").Code; got != http.StatusOK {
				t.Fatalf("a different visitor was blocked: %d", got)
			}
		})
	}
}

func TestMalformedForwardingFallsBackToConnection(t *testing.T) {
	for _, chain := range []string{"", "garbage", "198.51.100.10, garbage", "198.51.100.10,", "198.51.100.10:443", "fe80::1%eth0", "0.0.0.0", "::", "224.0.0.1", strings.Repeat("10.0.0.2,", 65) + "10.0.0.3"} {
		t.Run(chain, func(t *testing.T) {
			h := proxyFixture(t, "127.0.0.1/32", "10.0.0.0/24")
			proxyRequest(h, "127.0.0.1:48000")
			proxyRequest(h, "127.0.0.1:48001")
			if got := proxyRequest(h, "127.0.0.1:48002", chain).Code; got != http.StatusTooManyRequests {
				t.Fatalf("malformed forwarding bypassed the connection limit: %d", got)
			}
		})
	}
}

func TestProxyHTTPSHeaders(t *testing.T) {
	for _, test := range []struct {
		name, peer  string
		trusted     []string
		proto       []string
		tls, secure bool
	}{
		{name: "direct HTTP", peer: "192.0.2.1:80"},
		{name: "direct TLS", peer: "192.0.2.1:443", tls: true, secure: true},
		{name: "trust disabled", peer: "127.0.0.1:80", proto: []string{"https"}},
		{name: "untrusted HTTPS claim", peer: "192.0.2.1:80", trusted: []string{"127.0.0.1"}, proto: []string{"https"}},
		{name: "trusted HTTPS", peer: "127.0.0.1:80", trusted: []string{"127.0.0.1"}, proto: []string{"https"}, secure: true},
		{name: "trusted IPv6 HTTPS", peer: "[::1]:80", trusted: []string{"::1/128"}, proto: []string{"https"}, secure: true},
		{name: "trusted CIDR HTTPS", peer: "10.0.0.2:80", trusted: []string{"10.0.0.0/24"}, proto: []string{"https"}, secure: true},
		{name: "outside trusted CIDR", peer: "10.0.1.2:80", trusted: []string{"10.0.0.0/24"}, proto: []string{"https"}},
		{name: "trusted HTTP", peer: "127.0.0.1:80", trusted: []string{"127.0.0.1"}, proto: []string{"http"}},
		{name: "ambiguous list", peer: "127.0.0.1:80", trusted: []string{"127.0.0.1"}, proto: []string{"https, http"}},
		{name: "duplicate fields", peer: "127.0.0.1:80", trusted: []string{"127.0.0.1"}, proto: []string{"https", "http"}},
		{name: "TLS overrides HTTP header", peer: "127.0.0.1:443", trusted: []string{"127.0.0.1"}, proto: []string{"http"}, tls: true, secure: true},
	} {
		t.Run(test.name, func(t *testing.T) {
			h := proxyFixture(t, test.trusted...)
			r := httptest.NewRequest(http.MethodGet, "http://portfolio.example/api/health", nil)
			r.RemoteAddr = test.peer
			for _, value := range test.proto {
				r.Header.Add("X-Forwarded-Proto", value)
			}
			if test.tls {
				r.TLS = &tls.ConnectionState{}
			}
			w := httptest.NewRecorder()
			h.ServeHTTP(w, r)
			if got := w.Header().Get("Strict-Transport-Security") != ""; got != test.secure {
				t.Fatalf("HSTS present = %v, want %v", got, test.secure)
			}
		})
	}
}

func TestInvalidTrustedProxyConfigurationIsRejected(t *testing.T) {
	for _, value := range []string{"not-an-ip", "127.0.0.1:8080", "10.0.0.0/33", "fe80::1%eth0"} {
		t.Run(value, func(t *testing.T) {
			h, err := New(Config{ContentDir: t.TempDir(), TrustedProxies: []string{value}})
			if h != nil {
				h.Close()
			}
			if err == nil {
				t.Fatal("invalid trusted proxy configuration was accepted")
			}
		})
	}
}
