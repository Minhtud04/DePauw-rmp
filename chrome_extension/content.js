const BASE_URL = "http://127.0.0.1:5000";
// Changed from Set to an Object to store professor data from API
let professorDataMap = {}; 

/**
 * @description Extracts instructor names from the current DePauw SOC results page
 * @returns {Array[String]} A sorted array of unique names found.
 */
const extractProfessorNamesFromPage = () => {
    const uniqueNamesFound = new Set();
    const courseRows = document.querySelectorAll('tr[valign="top"]');

    courseRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 12) { // Instr/Rm is the 13th cell (index 12)
            const instrRmCell = cells[12];
            const fontElement = instrRmCell.querySelector('font[face="arial, helvetica"]');

            if (fontElement) {
                let html = fontElement.innerHTML;
                let instructorBlockHtml = '';
                const breakTags = Array.from(html.matchAll(/<br\s*\/?>/gi));
                let roomSeparatorIndex = -1;

                if (breakTags.length > 0) {
                    for (let i = breakTags.length - 1; i >= 0; i--) {
                        const brTag = breakTags[i];
                        const contentAfterBrHTML = html.substring(brTag.index + brTag[0].length).trim();
                        const tempDivForText = document.createElement('div');
                        tempDivForText.innerHTML = contentAfterBrHTML;
                        const textAfterBr = (tempDivForText.textContent || tempDivForText.innerText).trim();

                        if (contentAfterBrHTML.toLowerCase().startsWith('<font size="1">') ||
                            (textAfterBr.length > 0 && textAfterBr.length <= 10 && (textAfterBr === textAfterBr.toUpperCase() || /\d/.test(textAfterBr))) ||
                            (textAfterBr.toLowerCase() === "arr")) {
                            roomSeparatorIndex = brTag.index;
                            break;
                        }
                    }
                }
                
                if (roomSeparatorIndex !== -1) {
                    instructorBlockHtml = html.substring(0, roomSeparatorIndex);
                } else {
                    const tempDivForFullText = document.createElement('div');
                    tempDivForFullText.innerHTML = html;
                    const fullTextContent = (tempDivForFullText.textContent || tempDivForFullText.innerText).trim();
                    if (fullTextContent.length > 2 && fullTextContent.toLowerCase() !== 'arr' &&
                        !(fullTextContent.length <= 10 && fullTextContent === fullTextContent.toUpperCase() && /\d/.test(fullTextContent))) {
                       instructorBlockHtml = html;
                    }
                }

                if (instructorBlockHtml) {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = instructorBlockHtml;
                    let textContent = (tempDiv.textContent || tempDiv.innerText || "").trim();
                    const names = textContent.split(/,\s*|\s*<br\s*\/?>\s*/i)
                        .map(name => name.trim())
                        .filter(name => name && name.length > 2 && name.toLowerCase() !== 'arr');

                    names.forEach(name => {
                        if (!(/^(OL|HH|JSC|AH|PELR|EC|ROW|GCPA|PCCM|LC)\s*\d/.test(name.toUpperCase()) && name.length < 8)) {
                             if (name.toUpperCase() === name && name.length <= 5 && /\d/.test(name) && name !== "Staff") {
                                // Exclude likely room codes
                             } else {
                                uniqueNamesFound.add(name);
                             }
                        }
                    });
                }
            }
        }
    });
    console.log("Found these unique professor names on page:", uniqueNamesFound);
    return Array.from(uniqueNamesFound).sort();
};

/**
 * @description Stores the professor data received from the API into the global professorDataMap.
 * @param {object} apiResponse - The response object from the backend.
 */
const storeProfessorApiData = (apiResponse) => {
  professorDataMap = {}; // Clear previous data
  if (apiResponse && apiResponse.data && Array.isArray(apiResponse.data)) {
    apiResponse.data.forEach(prof => {
      if (prof.name) {
        professorDataMap[prof.name.trim()] = { // Use trimmed name as key
          rating: prof.rating,
          difficulty: prof.difficulty,
          num_ratings: prof.num_ratings,
          id: prof.id
        };
      }
    });
    console.log("Professor data map updated:", professorDataMap);
  } else {
    console.error("No valid professor data received from API or data format is unexpected.");
  }
};

/**
 * @description updates the html table with professor data
 */
const updateTableWithProfessorData = () => {
  console.log("Updating table with professor data...");
  const courseRows = document.querySelectorAll('tr[valign="top"]');

  courseRows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length > 12) {
      const instrRmCell = cells[12];
      const fontElement = instrRmCell.querySelector('font[face="arial, helvetica"]');

      if (fontElement) {
        let originalHtml = fontElement.innerHTML;
        let instructorBlockHtml = '';
        const breakTags = Array.from(originalHtml.matchAll(/<br\s*\/?>/gi));
        let roomSeparatorIndex = -1;

        if (breakTags.length > 0) {
            for (let i = breakTags.length - 1; i >= 0; i--) {
                const brTag = breakTags[i];
                const contentAfterBrHTML = originalHtml.substring(brTag.index + brTag[0].length).trim();
                const tempDivForText = document.createElement('div');
                tempDivForText.innerHTML = contentAfterBrHTML;
                const textAfterBr = (tempDivForText.textContent || tempDivForText.innerText).trim();
                if (contentAfterBrHTML.toLowerCase().startsWith('<font size="1">') ||
                    (textAfterBr.length > 0 && textAfterBr.length <= 10 && (textAfterBr === textAfterBr.toUpperCase() || /\d/.test(textAfterBr))) ||
                    (textAfterBr.toLowerCase() === "arr")) {
                    roomSeparatorIndex = brTag.index;
                    break;
                }
            }
        }
        
        if (roomSeparatorIndex !== -1) {
            instructorBlockHtml = originalHtml.substring(0, roomSeparatorIndex);
        } else {
            const tempDivForFullText = document.createElement('div');
            tempDivForFullText.innerHTML = originalHtml;
            const fullTextContent = (tempDivForFullText.textContent || tempDivForFullText.innerText).trim();
            if (fullTextContent.length > 2 && fullTextContent.toLowerCase() !== 'arr' &&
                !(fullTextContent.length <= 10 && fullTextContent === fullTextContent.toUpperCase() && /\d/.test(fullTextContent))) {
               instructorBlockHtml = originalHtml;
            }
        }

        if (instructorBlockHtml) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = instructorBlockHtml;
          let currentInstructorsText = (tempDiv.textContent || tempDiv.innerText || "").trim();
          
          let newInstructorHtml = instructorBlockHtml; // Start with original HTML for this block

          // Split the text content to find individual names for map lookup
          const currentNamesInCell = currentInstructorsText.split(/,\s*|\s*<br\s*\/?>\s*/i)
            .map(name => name.trim())
            .filter(name => name && name.length > 2);

          currentNamesInCell.forEach(nameInCell => {
            const profData = professorDataMap[nameInCell];
            if (profData) {
              console.log(`Data found for ${nameInCell}:`, profData);
              
              // 1. Highlight: Simple background color for the name
              // To do this, we need to wrap the specific name in a span if it's not already.
              // This can be tricky if names are just text nodes within the fontElement.
              // For a simpler start, we can highlight the whole cell or font element.
              // A more precise way is to replace the text name with a styled span.

              const profNameRegex = new RegExp(nameInCell.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "g");
          
            // highlight color based on rating: >= 4.0 -> green, 2.0-3.9 -> yellow, <2.0 -> red
              let highlightColor = 'yellow';
              if (profData.rating >= 4.0) {
                highlightColor = '#99ff99'; //light green
              } else if (profData.rating < 2.0) {
                highlightColor = 'ffcccb'; //light red
              }

            // Replace the name text with an <a> tag
              newInstructorHtml = newInstructorHtml.replace(
                profNameRegex, 
                `<span class="prof-highlight" data-name="${nameInCell}" style="background-color: ${highlightColor}; cursor: pointer;">` +
                `<a href="https://www.ratemyprofessors.com/professor/${profData.id}" target="_blank" style="text-decoration: underline; color: inherit;">${nameInCell}</a>` +
                `</span>`
              );
            }
          });

          fontElement.innerHTML = newInstructorHtml; // Update the cell with highlighted names
          
          // Add event listeners to newly created spans
          instrRmCell.querySelectorAll('span.prof-highlight').forEach(span => {
            span.style.cursor = "pointer";

            const profNameFromDataAttr = span.dataset.name;
            const profDetails = professorDataMap[profNameFromDataAttr];

            if (profDetails) {
                let tooltip = document.getElementById(`tooltip-${profNameFromDataAttr.replace(/\s+/g, '-')}`);
                if (!tooltip) {
                    tooltip = document.createElement('div');
                    tooltip.id = `tooltip-${profNameFromDataAttr.replace(/\s+/g, '-')}`;
                    tooltip.className = 'professor-tooltip';
                    tooltip.style.position = 'absolute';
                    tooltip.style.border = '1px solid black';
                    tooltip.style.backgroundColor = 'white';
                    tooltip.style.padding = '5px';
                    tooltip.style.zIndex = '1000';
                    tooltip.style.display = 'none'; // Initially hidden
                    tooltip.style.fontSize = '12px';
                    document.body.appendChild(tooltip);
                }

                tooltip.innerHTML = `
                    <strong>${profNameFromDataAttr}</strong><br>
                    Rating: ${profDetails.rating || 'N/A'}<br>
                    Difficulty: ${profDetails.difficulty || 'N/A'}<br>
                    Num Ratings: ${profDetails.num_ratings || 'N/A'}
                `;

                span.addEventListener('mouseover', (event) => {
                    const rect = span.getBoundingClientRect();
                    tooltip.style.left = `${rect.left + window.scrollX}px`;
                    tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`; // Position below the name
                    tooltip.style.display = 'block';
                });

                span.addEventListener('mouseout', () => {
                    tooltip.style.display = 'none';
                });

              //   span.addEventListener('click', (event) => {
              //     event.preventDefault(); // Prevent any default span action
              //     event.stopPropagation(); // Stop the event from bubbling up
              //     console.log(`Clicked on ${profNameFromDataAttr}, navigating to Google.`);
              //     window.location.href = `https://www.ratemyprofessors.com/professor/${profDetails.id}`;
              // });
            }
          });
        }
      }
    }
  });
};


/**
 * @description Sends a list of professors to the backend to search for their data
 * @param {Array[String]} listOfProfessors 
 * @returns {Promise} A Json object with a list of professor's data
 */
const search_professors = (listOfProfessors) => {
  console.log("Sending this list of professors to backend:", listOfProfessors);
  
  axios.post(`${BASE_URL}/search/professors`, { professors: listOfProfessors })
    .then(response => {
      const apiResponseData = response.data; // The full response { count, data, exists }
      console.log("Professor search API call successful!", apiResponseData);
      if (apiResponseData && apiResponseData.exists && apiResponseData.data) {
        storeProfessorApiData(apiResponseData); // Store the detailed data
        updateTableWithProfessorData();    // Update the table with highlights and hovers
      } else {
        console.log("API indicated no data exists or data format is incorrect for professors:", listOfProfessors);
      }
    })
    .catch(error => {
      console.error("Professor search API error:", error.message);
    });
};


$(document).ready(function() {
  console.log("DOM fully loaded for DePauw SOC Extension.");
  
  const professorListFromPage = extractProfessorNamesFromPage();
  
  if (professorListFromPage && professorListFromPage.length > 0) {
    search_professors(professorListFromPage); 
  } else {
    console.error("No professors found on the page to search.");
  }
});