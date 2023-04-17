# movie-scraper

<img src="icon.png"  height="100px" />

## Description

This is a simple web scraper CLI app that scrapes movies from multiple sources and allows you to download them

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

You will be prompted to enter the [IMDb](https://imdb.com) ID of the movie you want to download. The program will attempt to find the movie on multiple sources and download it.

The file format is either `mp4` or `m3u8` depending on the source. In order to play the file, you will need a media player that supports `m3u8` files. I recommend [VLC](https://www.videolan.org/vlc/index.html).

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## Credits

Some of the providers were pulled from the [movie-web](https://github.com/movie-web/movie-web) project. This project would not have been possible without their work.

## License

[MIT](https://choosealicense.com/licenses/mit/)
