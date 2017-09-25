# brew-tour

GUI and summarizer to help prune excess Homebrew-installed packages.


## Install and run

```sh
npm install -g brew-tour
brew-tour
```

Then open [`http://localhost:1394/`](http://localhost:1394/) in your browser.

This app will not modify your Homebrew installation in any way. It will use child processes to read your installed packages and the info pertaining to each one, but you will have to copy and paste the actual `brew uninstall ...` command into your terminal.


## License

Copyright (c) 2014-2017 Christopher Brown.
[MIT Licensed](https://chbrown.github.io/licenses/MIT/#2014-2017).
