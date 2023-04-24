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

- If you select the "Search" option, you will be able to search for a movie or show.
- If you select the "Download IMDb" option, you will be prompted to enter the [IMDb](https://imdb.com) ID of the stream you want to download. The program will attempt to find the movie on multiple sources and download it.

The file format is either `mp4`, `m3u8`, or `mkv`, depending on the source. Playing `mp4` files should be easy, but some other formats may not be supported. I recommend [VLC](https://www.videolan.org/vlc/index.html) (Cross-platform) or [IINA](https://iina.io/) (MacOS).

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change. If you have any suggestions or need support, please open an issue.

## Credits

Some of the providers were pulled from the [movie-web](https://github.com/movie-web/movie-web) project. This project would not have been possible without their work.

## License

[MIT](https://choosealicense.com/licenses/mit/)
