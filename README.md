# TypeScript Script

This repository contains a TypeScript script.

## Installation

1. Make sure you have Node.js and npm (Node Package Manager) installed on your system. You can download them from [here](https://nodejs.org/).

2. Clone this repository to your local machine using the following command:

git clone git@github.com:seth-me-up/real_estate_scraper.git

3. Navigate to the directory of the cloned repository:

cd real_estate_scraper

4. Install dependencies by running the following command:

npm install


## Usage

To run the TypeScript script, you can use the following command:

npm start dev

This will compile the TypeScript code to JavaScript (if necessary) and execute the script.

## Script Details

The TypeScript script can be found in the `src` directory. You can modify the script as needed for your use case.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


# Postman Request 

Use POST Request with url http://localhost:3000/scrape

Body: 

{
    "search_item": "Beverlywood, Los Angeles, CA",
    "url": "https://www.homes.com/"
}