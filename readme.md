# DePauw professor Search 
*(Re-do from someone else extension (has been removed?) - idk but I enjoy it a lot)*

This browser extension accesses [DePauw University's static HTML course schedule](https://my.depauw.edu/e/reg/soc-view/results.asp) to display professor ratings from Rate My Professor.

## Run

Current, I have not publiced it in Chrome extension. Th

### Prerequisites
- [Node.js](https://nodejs.org/) v14 or higher
- [Python](https://www.python.org/) v3.8 or higher
- Any other dependencies

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/username/repository-name.git
   ```
2. Navigate to the project directory:
   ```bash
   cd repository-name
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
   or, for Python projects:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

Provide examples of how to use the project. For example:

```bash
# Run the application
npm start
```

For a Python script:
```python
import my_module

result = my_module.function_name()
print(result)
```

(Optionally, include a screenshot or GIF here for visual projects.)

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes and commit them:
   ```bash
   git commit -m "Add your feature"
   ```
4. Push to your branch:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a pull request with a clear description of your changes.

Please adhere to our [Code of Conduct](CODE_OF_CONDUCT.md) and follow the [contributing guidelines](CONTRIBUTING.md).

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

For questions or feedback, reach out via:
- Email: your.email@example.com
- GitHub Issues: [Repository Issues](https://github.com/username/repository-name/issues)

## Acknowledgments

- Thanks to [Contributor Name] for their valuable input.
- Built with [Library/Tool Name].

### Journal steps:
1. Create a python server just to host that script - a small flask server with only 1 endpoint

2. Strategy for JS extension:
- Local cache: fetch the json back to the extension, and store it inside the cache. 

- TTL: If over a month -> re-fetch. Else, keep it live inside this local folder.

JS extension:
1. JQuery to check if document is fully loaded or not.
    - will do this first - setup the environment !
2. If yes:
    - Locate all professor name inside
    - Send a request:
        - Include that list of name -> let backend handle


Backend Python:
1. Crawl script: get all data from RMP
2. Response:
    - merge data from the rmp, and the data I just received !