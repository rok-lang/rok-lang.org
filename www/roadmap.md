# Roadmap

Where rok is today and where it is headed. A version is cut when its work is ready, so the headings below are direction, not a schedule.

For specific, trackable work, follow the issues on [GitHub](https://github.com/rok-lang/rok/issues).

## Now: 0.1.0

The first public release.

- The toolchain: `rokc`, the compiler, with LLVM built in; `rok`, the package and toolchain front end; and `rokls`, the language server.
- Ahead-of-time native builds, with prebuilt archives for six hosts: macOS on Apple silicon, Linux on x86_64 and arm64 (both glibc and static musl), and Windows on x86_64. Every archive cross-compiles to the other targets with nothing more to install.
- A REPL and a Jupyter kernel.
- The first stones on [rokstones.io](https://rokstones.io), added with `rok add` and pinned in `rok.lock`.

See [Download](download.html) for the archives, the cross-compilation targets, and the install script.

## Next: 0.2.0

- Prebuilt archives for more hosts: Windows on arm64 (`aarch64-pc-windows-msvc`) and 32-bit Arm Linux (`armv7`, both glibc and musl). You can already cross-compile to these from any 0.1.0 host; 0.2.0 makes them hosts of their own.
- A larger standard library and more published stones.

## Later

Directions we want to explore, not tied to a version yet.

- Prebuilt archives for the remaining hosts that build from source today, such as Intel Macs.
- Editor support beyond the current Vim and VS Code integrations.

Want something that is not here? Open an issue or start a discussion on [GitHub](https://github.com/rok-lang/rok).
