# movie-scraper

<img src="img/demo.gif" />

## Description

**CLI app that scrapes movies and shows from multiple sources and allows you to download them**

## Installation

```
git clone https://github.com/zisra/movie-scraper
cd movie-scraper
npm install
```

## Usage

```
npm start
```

You will be prompted to search for a movie or show. The app will then scrape multiple sources for the movie or show and display the results. You can then select a source and download the file.

The file format is either `mp4`, `m3u8`, or `mkv`, depending on the source. Playing `mp4` files should relatively be easy, but some other formats may not be supported. I recommend [VLC](https://www.videolan.org/vlc/index.html) (Cross-platform) or [IINA](https://iina.io/) (MacOS).

## Options

You can change options in the `.env` file in the root directory or set the environment variables. Possible options are:

```sh
DOWNLOAD_COMMAND=open -a IINA <url> # Command to run with the download link. '<url>' will be be automatically replaced with the download link
DEBUG_MODE=true # Log complete error messages
TIMEOUT_MS=10000 # Timeout for each scraper in milliseconds
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change. If you have any suggestions or need support, please open an issue.

## Credits

Some of the providers were pulled from the [movie-web](https://github.com/movie-web/movie-web) project. This project would not have been possible without their work.

## License

[MIT](https://choosealicense.com/licenses/mit/)
