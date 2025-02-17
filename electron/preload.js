// 所有的 Node.js API接口 都可以在 preload 进程中被调用.
// 它拥有与Chrome扩展一样的沙盒。

// 该项目需要动态执行js
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;
