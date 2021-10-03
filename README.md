# DrawingBoard drawing app

A realtime drawing app that can be used along side OBS to bring interactive whiteboard to stream

## Getting started

Start using Node

```bash
# Install dependencies for server
npm install

# Run the server
node server
```

Start using Docker

```bash
# Building the image
docker build --tag socketiodrawing .

# Run the image in a container
docker run -d -p 3000:3000 socketiodrawing
```

## Author

Matthew Deloughry

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details

Thank you to [Gabriel Tanner](https://github.com/TannerGabriel) for skeleton code, without this I'd be clueless! - [DrawingApp](https://github.com/TannerGabriel/DrawingApp)
