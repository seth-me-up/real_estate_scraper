import express, { Request, Response } from 'express';
import puppeteer from 'puppeteer';

const app = express();
const port = 3000;

// Define the type for tempObj
interface ListingInfo {
    name: string;
    description: string;
    price: string;
    beds: string;
    bath: string;
    square_feet: string;
    lot_size: string;
    address: string;
    listing_url: string
}

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.send('Hello World!');
});

app.post('/scrape', async (req: Request, res: Response) => {
    const search_item = req.body.search_item;
    const url = req.body.url;

    if (!search_item) {
        res.status(400).send('Search parameter is missing');
        return;
    }

    if (!url) {
        res.status(400).send('URL parameter is missing');
        return;
    }

    try {
        const browser = await puppeteer.launch({
            args: [
                '--start-maximized',
                '--ignore-certificate-errors',
                '--disable-gpu',
                '--disable-dev-shm-usage',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--allow-running-insecure-content'
            ],
            defaultViewport: null,
            headless: false,
            timeout: 600000
        });
        const userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) snap Chromium/80.0.3987.87 Chrome/80.0.3987.87 Safari/537.36'
        const page = await browser.newPage();
        await page.setUserAgent(userAgent)
        await page.setDefaultNavigationTimeout(0);

        let listingResults: ListingInfo[] = []
        switch (url) {
            case "https://www.realtor.com/":
                await page.goto(url, { waitUntil: 'networkidle0' });
                await page.waitForSelector('div[data-testid="searchbar"] input[type="text"]');
                await page.type('div[data-testid="searchbar"] input[type="text"]', search_item)
                await page.waitForSelector('div[data-testid="searchbar"] button[aria-label="Search"]')
                await page.click('div[data-testid="searchbar"] button[aria-label="Search"]')

                await page.waitForSelector('[class^="BasePropertyCard_propertyCardWrap"]')

                listingResults = await page.evaluate(() => {
                    let tempResults: ListingInfo[] = [];
                    const listingContainers = document.querySelectorAll('[class^="BasePropertyCard_propertyCardWrap"]');
                    for (let container of listingContainers) {
                        let tempObj: ListingInfo = {
                            name: "",
                            description: "",
                            price: "",
                            beds: "",
                            bath: "",
                            square_feet: "",
                            lot_size: "",
                            address: "",
                            listing_url: ""
                        };
                        const priceContainer = container.querySelector('[class^="BasePropertyCard_propertyCardWrap"]');
                        if (priceContainer) {
                            tempObj['price'] = priceContainer.textContent ? priceContainer.textContent : "";
                        }

                        const bedContainer = container.querySelector('li[data-testid="property-meta-beds"] span[data-testid="meta-value"]');
                        if (bedContainer) {
                            tempObj['beds'] = bedContainer.textContent ? bedContainer.textContent : "";
                        }

                        const bathContainer = container.querySelector('li[data-testid="property-meta-baths"] span[data-testid="meta-value"]');
                        if (bathContainer) {
                            tempObj['bath'] = bathContainer.textContent ? bathContainer.textContent : "";
                        }

                        const sqFeetContainer = container.querySelector('li[data-testid="property-meta-sqft"] span[data-testid="meta-value"]');
                        if (sqFeetContainer) {
                            tempObj['square_feet'] = sqFeetContainer.textContent ? sqFeetContainer.textContent : "";
                        }

                        const lotSizeContainer = container.querySelector('li[data-testid="property-meta-sqft"] span[data-testid="meta-value"]');
                        if (lotSizeContainer) {
                            tempObj['lot_size'] = lotSizeContainer.textContent ? lotSizeContainer.textContent : "";
                        }
                        tempResults.push(tempObj)
                    }
                    return tempResults
                })
                break;

            case "https://www.trulia.com/":
                await page.goto(url, { waitUntil: 'networkidle0' });
                await page.waitForSelector('input[data-testid="location-search-input"]');
                await page.click('input[data-testid="location-search-input"]');
                await page.type('input[data-testid="location-search-input"]', search_item)
                await page.keyboard.press('Enter');
                await page.click('div[data-testid="location-search-button"]');

                await page.waitForSelector('ul[data-testid="search-result-list-container"]')

                listingResults = await page.evaluate(() => {
                    let tempResults: ListingInfo[] = [];
                    const listingContainers = document.querySelectorAll('ul[data-testid="search-result-list-container"] li');
                    for (let container of listingContainers) {
                        let tempObj: ListingInfo = {
                            name: "",
                            description: "",
                            price: "",
                            beds: "",
                            bath: "",
                            square_feet: "",
                            lot_size: "",
                            address: "",
                            listing_url: ""
                        };
                        const priceContainer = container.querySelector('div[data-testid="property-price"]');
                        if (priceContainer) {
                            tempObj['price'] = priceContainer.textContent ? priceContainer.textContent : "";
                        }

                        const bedContainer = container.querySelector('div[data-testid="property-beds"]');
                        if (bedContainer) {
                            tempObj['beds'] = bedContainer.textContent ? bedContainer.textContent : "";
                        }

                        const bathContainer = container.querySelector('div[data-testid="property-baths"]');
                        if (bathContainer) {
                            tempObj['bath'] = bathContainer.textContent ? bathContainer.textContent : "";
                        }

                        const sqFeetContainer = container.querySelector('div[data-testid="property-floorSpace"]');
                        if (sqFeetContainer) {
                            tempObj['square_feet'] = sqFeetContainer.textContent ? sqFeetContainer.textContent : "";
                        }

                        const addressContainer = container.querySelector('div[data-testid="property-address"]');
                        if (addressContainer) {
                            tempObj['address'] = addressContainer.textContent ? addressContainer.textContent : "";
                        }

                        const urlContainer = container.querySelector('div[data-testid="property-card-carousel-container"] a');
                        if (urlContainer) {
                            const link = urlContainer.getAttribute('href');
                            tempObj['listing_url'] = link ? `https://www.trulia.com${link}` : "";
                        }

                        tempResults.push(tempObj)
                    }
                    return tempResults
                })

                break;
            
            case "https://fsbo.com/":
                await page.goto(url, { waitUntil: 'networkidle0' });
                await page.waitForSelector('input[name="searchQuery"]');
                await page.type('input[name="searchQuery"', search_item);
                await page.click('button[type="submit"]');

                let hasNextPage: boolean = true; 
                while (hasNextPage) {
                    await sleep(2000);
                    console.log("Start scraping data.")
                    await page.waitForSelector('div.listings div.row.listing-item')

                    let results = await page.evaluate(() => {
                        let tempResults: ListingInfo[] = [];
                        const listingContainers = document.querySelectorAll('div.listings div.row.listing-item');
                        for (let container of listingContainers) {
                            let tempObj: ListingInfo = {
                                name: "",
                                description: "",
                                price: "",
                                beds: "",
                                bath: "",
                                square_feet: "",
                                lot_size: "",
                                address: "",
                                listing_url: ""
                            };
    
                            const nameContainer = container.querySelector('div.listing-left h4 a');
                            if (nameContainer) {
                                tempObj['name'] = nameContainer.textContent ? nameContainer.textContent : "";
                            }
    
                            const descContainer = container.querySelector('div.listing-left p');
                            if (descContainer) {
                                tempObj['description'] = descContainer.textContent ? descContainer.textContent.trim() : "";
                            }
    
                            const priceContainer = container.querySelector('div.text-right.listing-right div h4');
                            if (priceContainer) {
                                tempObj['price'] = priceContainer.textContent ? priceContainer.textContent : "";
                            }
                            container.querySelector('div.text-right.listing-right div h4')?.remove()
                            
    
                            const addressContainer = container.querySelector('div.listing-right div');
                            if (addressContainer) {
                                if (addressContainer.textContent) {
                                    const regex = /(?<address>.+)\s+Beds:\s*(?<beds>\d+)\s+Baths:\s*(?<baths>\d+)(?:\s+Sq\.Ft\.:\s*(?<squareFeet>\d+))?/;
    
                                    const match = addressContainer.textContent.match(regex);
                                    if (!match || !match.groups) {
                                        throw new Error('Invalid property information format');
                                    }
        
                                    const { address, baths, beds, squareFeet } = match.groups;
                                    
                                    tempObj['address'] = address.replace(/\s+/g, ' ');
                                    tempObj['beds'] = baths.trim();
                                    tempObj['bath'] = beds.trim();
                                    tempObj['square_feet'] = squareFeet ? squareFeet : "";
                                }
                            }                     
    
                            const urlContainer = container.querySelector('div.listing-left h4 a');
                            if (urlContainer) {
                                const link = urlContainer.getAttribute('href');
                                tempObj['listing_url'] = link ? `${link}` : "";
                            }
    
                            tempResults.push(tempObj)
                        }
                        return tempResults
                    })
                    
                    if (results) {
                        console.log("Total Results for current page:", results.length)
                        listingResults.push(...results)
                    }
                    hasNextPage = await page.evaluate(() => {
                        const element = document.querySelector("a.nextPage");
                        if (element) return true;
                        else return false;
                    })
                    if (hasNextPage) {
                        console.log("Clicking Next Page");
                        await page.click("a.nextPage");
                    }
                }
                break;
            
            case "https://www.homes.com/":
                await page.goto(url, { waitUntil: 'networkidle0' });
                await page.waitForSelector('input.multiselect-search');
                await page.click('input.multiselect-search');
                await page.type('input.multiselect-search', search_item);
                await page.keyboard.press('Enter');

                await page.waitForSelector('.search-placards-container ul.placards-list li.placard-container article.search-placard')

                listingResults = await page.evaluate(() => {
                    let tempResults: ListingInfo[] = [];
                    const listingContainers = document.querySelectorAll('.search-placards-container ul.placards-list li.placard-container article.search-placard');
                    for (let container of listingContainers) {
                        let tempObj: ListingInfo = {
                            name: "",
                            description: "",
                            price: "",
                            beds: "",
                            bath: "",
                            square_feet: "",
                            lot_size: "",
                            address: "",
                            listing_url: ""
                        };

                        const nameContainer = container.querySelector('.agent-detail');
                        if (nameContainer) {
                            tempObj['name'] = nameContainer.textContent ? nameContainer.textContent : "";
                        }

                        const descContainer = container.querySelector('.property-description');
                        if (descContainer) {
                            tempObj['description'] = descContainer.textContent ? descContainer.textContent.trim() : "";
                        }
                        
                        const priceContainer = container.querySelector('p.price-container');
                        if (priceContainer) {
                            tempObj['price'] = priceContainer.textContent ? priceContainer.textContent : "";
                        }

                        const bedContainer = container.querySelector('ul.detailed-info-container li:nth-child(1)');
                        if (bedContainer) {
                            tempObj['beds'] = bedContainer.textContent ? bedContainer.textContent : "";
                        }

                        const bathContainer = container.querySelector('ul.detailed-info-container li:nth-child(2)');
                        if (bathContainer) {
                            tempObj['bath'] = bathContainer.textContent ? bathContainer.textContent : "";
                        }

                        const sqFeetContainer = container.querySelector('ul.detailed-info-container li:nth-child(3)');
                        if (sqFeetContainer) {
                            tempObj['square_feet'] = sqFeetContainer.textContent ? sqFeetContainer.textContent : "";
                        }

                        const addressContainer = container.querySelector('address');
                        if (addressContainer) {
                            tempObj['address'] = addressContainer.textContent ? addressContainer.textContent : "";
                        }

                        const urlContainer = container.querySelector('a');
                        if (urlContainer) {
                            const link = urlContainer.getAttribute('href');
                            tempObj['listing_url'] = link ? `https://www.trulia.com${link}` : "";
                        }

                        tempResults.push(tempObj)
                    }
                    return tempResults
                })

                break;
            default:
                break;
        }
        
        await browser.close();
        res.json(listingResults);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('An error occurred');
    }
});

app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});
