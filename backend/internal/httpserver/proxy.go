package httpserver

import (
	"fmt"
	"net/http"
	"net/netip"
	"strings"
)

const maxForwardedHops = 64

type proxyPolicy []netip.Prefix

func newProxyPolicy(entries []string) (proxyPolicy, error) {
	var policy proxyPolicy
	for _, entry := range entries {
		entry = strings.TrimSpace(entry)
		if entry == "" {
			continue
		}
		if address, err := netip.ParseAddr(entry); err == nil && address.Zone() == "" {
			address = address.Unmap()
			policy = append(policy, netip.PrefixFrom(address, address.BitLen()))
			continue
		}
		prefix, err := netip.ParsePrefix(entry)
		if err != nil {
			return nil, fmt.Errorf("invalid trusted proxy %q: expected an IP address or CIDR", entry)
		}
		if prefix.Addr().Is4In6() {
			if prefix.Bits() < 96 {
				return nil, fmt.Errorf("invalid trusted proxy %q: IPv4-mapped CIDR extends beyond IPv4", entry)
			}
			prefix = netip.PrefixFrom(prefix.Addr().Unmap(), prefix.Bits()-96)
		}
		policy = append(policy, prefix.Masked())
	}
	return policy, nil
}

func (p proxyPolicy) contains(address netip.Addr) bool {
	for _, prefix := range p {
		if prefix.Contains(address.Unmap()) {
			return true
		}
	}
	return false
}

func (p proxyPolicy) clientInfo(r *http.Request) (address string, secure bool) {
	secure = r.TLS != nil
	peer, err := netip.ParseAddrPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr, secure
	}
	ip := peer.Addr().Unmap()
	address = ip.String()
	if !p.contains(ip) {
		return address, secure
	}
	// Only the directly connected, explicitly trusted proxy can attest to TLS.
	proto := r.Header.Values("X-Forwarded-Proto")
	secure = secure || len(proto) == 1 && strings.EqualFold(strings.TrimSpace(proto[0]), "https")
	forwarded := r.Header.Values("X-Forwarded-For")
	if len(forwarded) == 0 {
		return address, secure
	}
	chain := strings.SplitN(strings.Join(forwarded, ","), ",", maxForwardedHops+1)
	if len(chain) > maxForwardedHops {
		return address, secure
	}
	// Walk toward the client from the connection we trust. Everything to the
	// left of the first untrusted hop may have been supplied by that caller.
	for i := len(chain) - 1; i >= 0; i-- {
		candidate, err := netip.ParseAddr(strings.TrimSpace(chain[i]))
		if err != nil || candidate.Zone() != "" {
			return address, secure
		}
		candidate = candidate.Unmap()
		if candidate.IsUnspecified() || candidate.IsMulticast() {
			return address, secure
		}
		ip = candidate
		if !p.contains(ip) {
			return ip.String(), secure
		}
	}
	return ip.String(), secure
}
