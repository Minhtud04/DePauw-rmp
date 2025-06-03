# DePauw professor Search 
*(Re-do from someone else extension (has been removed?))*

This extension accesses [DePauw University's static HTML course schedule](https://my.depauw.edu/e/reg/soc-view/results.asp) to display professor ratings from Rate My Professor.

### Logic
The idea is simple:
1. Crawl DePauw professor's data from Rate My Professor's GraphQL (https://www.ratemyprofessors.com/graphql) -> luckily the rmp's endpoint is easy to find in Inspect/Network

2. Store in the extension's local storage to avoid excessive re-fetch (still need to enable annual re-fetching mechanism at the start of each course's selection season)

3. Loop through the course schedule static html page, and find match of the professor's name in the course table and rmp crawl data above (Fuzzy Match if needed)


**Lesson Learnt**
1. Reading /Inspect/Network tab of browsers
2. Writing a browser's extension: manifest.json/background scripts/mains cripts
3. Build bundles with node.js and webpack


### Local Run
(Install [Node.js](https://nodejs.org/) v14 or higher)
1. Clone the repository:
   ```bash
   git clone https://github.com/Minhtud04/DePauw-rmp.git
   
   cd chrome_extension_v2
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

3. Packing/Build
   ```bash
   npm run build
   ```
   
4. Add local extension
- Look for: https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/getting-started/extension-sideloading
- Load  /dist (built folder)

***Will publish soon***


## Contact
- Email: minhnguyen150403@gmail.com

