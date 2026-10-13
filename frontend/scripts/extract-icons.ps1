$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
public static class WindowsStockIcons {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  struct StockInfo {
    public uint size;
    public IntPtr icon;
    public int imageIndex;
    public int iconIndex;
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 260)] public string path;
  }
  [DllImport("shell32.dll")] static extern int SHGetStockIconInfo(uint id, uint flags, ref StockInfo info);
  [DllImport("shell32.dll", EntryPoint = "SHGetImageList")] static extern int SHGetImageList(int size, ref Guid iid, out IntPtr list);
  [DllImport("user32.dll")] static extern bool DestroyIcon(IntPtr icon);
  [UnmanagedFunctionPointer(CallingConvention.StdCall)] delegate int GetIcon(IntPtr list, int index, uint flags, out IntPtr icon);
  public static void Export(uint id, string destination) {
    var info = new StockInfo { size = (uint)Marshal.SizeOf(typeof(StockInfo)) };
    Marshal.ThrowExceptionForHR(SHGetStockIconInfo(id, 0x4000, ref info));
    var iid = new Guid("46EB5926-582E-4017-9FDF-E8998DAA0950");
    IntPtr list;
    Marshal.ThrowExceptionForHR(SHGetImageList(4, ref iid, out list));
    try {
      var table = Marshal.ReadIntPtr(list);
      var getIcon = (GetIcon)Marshal.GetDelegateForFunctionPointer(Marshal.ReadIntPtr(table, 10 * IntPtr.Size), typeof(GetIcon));
      IntPtr handle;
      Marshal.ThrowExceptionForHR(getIcon(list, info.imageIndex, 1, out handle));
      try { using (var icon = Icon.FromHandle(handle)) using (var bitmap = icon.ToBitmap()) bitmap.Save(destination, ImageFormat.Png); }
      finally { DestroyIcon(handle); }
    } finally { Marshal.Release(list); }
  }
}
'@
$taskAssetDir = Join-Path (Split-Path $PSScriptRoot -Parent) 'public/assets/icons'
foreach ($taskItem in @(@{ Id = 15; Name = 'pc-native' }, @{ Id = 3; Name = 'folder-native' }, @{ Id = 0; Name = 'document-native' })) {
  [WindowsStockIcons]::Export($taskItem.Id, (Join-Path $taskAssetDir ($taskItem.Name + '.png')))
}
