
import stringSimilarity from 'string-similarity';

// Function to load professor data from JSON file and create a lookup map
async function loadProfessorDataMap() {
  try {
    // Cache usage
    let { depauwProfessorsData } = await chrome.storage.local.get('depauwProfessorsData');
    if (!depauwProfessorsData) {
      // Background fetch
      console.log("Fetching professor data from background script...");
      const response = await chrome.runtime.sendMessage({ type: 'FETCH_RMP_DATA' });
      if (response.error) {
        console.error('Background fetch failed:', response.error);
        return [];
      }
      depauwProfessorsData = response.professors || [];
    }

    console.log(`Loaded ${depauwProfessorsData.length} professors`);
    return depauwProfessorsData;
  } catch (error) {
    console.error(`Error loading professor data: ${error.message}`);
    return [];
  }
}

//Fuzzy Match
function foundProfessorData(professor_list, name_in_cell) {
  const THRESHOLD_NAME = 0.67;
  const THRESHOLD_FIRST_NAME = 0.5;
  const THRESHOLD_LAST_NAME = 0.85;

  let highest_similarity = 0.0;
  let best_match = null;

  for (const professor of professor_list) {
    const data_prof_name = `${professor.firstName} ${professor.lastName}`.trim();
    const name_similarity = stringSimilarity.compareTwoStrings(data_prof_name.toLowerCase(), name_in_cell.toLowerCase());

    // Extract last name and first name from name_in_cell
    const name_parts = name_in_cell.split(' ');
    const last_name = name_parts.length > 1 ? name_parts[name_parts.length - 1] : name_in_cell;
    const first_name = name_parts.length > 1 ? name_parts[0] : name_in_cell;

    const last_name_similarity = stringSimilarity.compareTwoStrings(professor.lastName.toLowerCase(), last_name.toLowerCase());
    const first_name_similarity = stringSimilarity.compareTwoStrings(professor.firstName.toLowerCase(), first_name.toLowerCase());

    const condition =
      name_similarity >= THRESHOLD_NAME &&
      last_name_similarity > THRESHOLD_LAST_NAME &&
      first_name_similarity >= THRESHOLD_FIRST_NAME;

    // Log fuzzy match details if condition is met but not a perfect match
    if (condition && name_similarity < 1.0) {
      console.log(
        `Fuzzy match ratio for "${data_prof_name}" and "${name_in_cell}": ${name_similarity.toFixed(3)}`,
        `for "${professor.lastName}" and "${last_name}": ${last_name_similarity.toFixed(3)}`,
        `for "${professor.firstName}" and "${first_name}": ${first_name_similarity.toFixed(3)}`
      );
    }

    if (condition && (name_similarity > highest_similarity)) {
        highest_similarity = name_similarity;
        best_match = professor;
    }
  }
  if (best_match != null){
        return {
            id:             best_match.legacyId,
            rating:         best_match.avgRating,
            difficulty:     best_match.avgDifficulty,
            num_ratings:    best_match.numRatings
        };
  }

  return null;
}



// Update table with professor data
async function updateTableWithProfessorData() {
  console.log("Updating table with professor data...");

  // Load professor data map
  const professorDataMap = await loadProfessorDataMap();

  const courseRows = document.querySelectorAll('tr[valign="top"]');
  let count = 0;
  courseRows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length > 12) { // Instr/Rm is the 13th cell (index 12)
      const instrRmCell = cells[12];
      const fontElement = instrRmCell.querySelector('font[face="arial, helvetica"]');

      if (fontElement) {
        let originalHtml = fontElement.innerHTML;
        let instructorBlockHtml = '';
        const breakTags = Array.from(originalHtml.matchAll(/<br\s*\/?>/gi));
        let roomSeparatorIndex = -1;

        // Find room separator
        if (breakTags.length > 0) {
          for (let i = breakTags.length - 1; i >= 0; i--) {
            const brTag = breakTags[i];
            const contentAfterBrHTML = originalHtml.substring(brTag.index + brTag[0].length).trim();
            const tempDivForText = document.createElement('div');
            tempDivForText.innerHTML = contentAfterBrHTML;
            const textAfterBr = (tempDivForText.textContent || tempDivForText.innerText).trim();
            if (
              contentAfterBrHTML.toLowerCase().startsWith('<font size="1">') ||
              (textAfterBr.length > 0 && textAfterBr.length <= 10 && (textAfterBr === textAfterBr.toUpperCase() || /\d/.test(textAfterBr))) ||
              textAfterBr.toLowerCase() === 'arr'
            ) {
              roomSeparatorIndex = brTag.index;
              break;
            }
          }
        }

        // Determine instructor block
        if (roomSeparatorIndex !== -1) {
          instructorBlockHtml = originalHtml.substring(0, roomSeparatorIndex);
        } else {
          const tempDivForFullText = document.createElement('div');
          tempDivForFullText.innerHTML = originalHtml;
          const fullTextContent = (tempDivForFullText.textContent || tempDivForFullText.innerText).trim();
          if (
            fullTextContent.length > 2 &&
            fullTextContent.toLowerCase() !== 'arr' &&
            !(fullTextContent.length <= 10 && fullTextContent === fullTextContent.toUpperCase() && /\d/.test(fullTextContent))
          ) {
            instructorBlockHtml = originalHtml;
          }
        }

        if (instructorBlockHtml) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = instructorBlockHtml;
          let currentInstructorsText = (tempDiv.textContent || tempDiv.innerText || '').trim();

          let newInstructorHtml = instructorBlockHtml;

          // Split the text content to find individual names
          const currentNamesInCell = currentInstructorsText
            .split(/,\s*|\s*<br\s*\/?>\s*/i)
            .map(name => name.trim())
            .filter(name => name && name.length > 2 && name.toLowerCase() !== 'arr');
          

          // Process each name immediately
          currentNamesInCell.forEach(nameInCell => {
            // Skip likely room codes
            if (
              !(/^(OL|HH|JSC|AH|PELR|EC|ROW|GCPA|PCCM|LC)\s*\d/.test(nameInCell.toUpperCase()) && nameInCell.length < 8) &&
              !(nameInCell.toUpperCase() === nameInCell && nameInCell.length <= 5 && /\d/.test(nameInCell) && nameInCell !== 'Staff')
            ) {
              const profData = foundProfessorData(professorDataMap, nameInCell);
              if (profData) {
                count += 1;

                // Highlight color based on rating
                let highlightColor = 'yellow';
                if (profData.rating >= 4.0) {
                  highlightColor = '#99ff99'; // light green
                } else if (profData.rating < 2.0) {
                  highlightColor = '#ffcccb'; // light red
                }

                // Replace the name with a styled span containing a link
                const profNameRegex = new RegExp(nameInCell.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                newInstructorHtml = newInstructorHtml.replace(
                  profNameRegex,
                  `<span class="prof-highlight" data-name="${nameInCell}" style="background-color: ${highlightColor}; cursor: pointer;">` +
                  `<a href="https://www.ratemyprofessors.com/professor/${profData.id}" target="_blank" style="text-decoration: underline; color: inherit;">${nameInCell}</a>` +
                  `</span>`
                );

                // Create or update tooltip
                let tooltip = document.getElementById(`tooltip-${nameInCell.replace(/\s+/g, '-')}`);
                if (!tooltip) {
                  tooltip = document.createElement('div');
                  tooltip.id = `tooltip-${nameInCell.replace(/\s+/g, '-')}`;
                  tooltip.className = 'professor-tooltip';
                  tooltip.style.position = 'absolute';
                  tooltip.style.border = '1px solid black';
                  tooltip.style.backgroundColor = 'white';
                  tooltip.style.padding = '5px';
                  tooltip.style.zIndex = '1000';
                  tooltip.style.display = 'none';
                  tooltip.style.fontSize = '12px';
                  document.body.appendChild(tooltip);
                }

                tooltip.innerHTML = `
                  <strong>${nameInCell}</strong><br>
                  Rating: ${profData.rating || 'N/A'}<br>
                  Difficulty: ${profData.difficulty || 'N/A'}<br>
                  Num Ratings: ${profData.num_ratings || 'N/A'}
                `;
              }
            }
          });

          // Update the cell with the new HTML
          fontElement.innerHTML = newInstructorHtml;

          // Add event listeners to spans for tooltips
          instrRmCell.querySelectorAll('span.prof-highlight').forEach(span => {
            span.style.cursor = 'pointer';
            const profNameFromDataAttr = span.dataset.name;
            const tooltip = document.getElementById(`tooltip-${profNameFromDataAttr.replace(/\s+/g, '-')}`);

            if (tooltip) {
              span.addEventListener('mouseover', (event) => {
                const rect = span.getBoundingClientRect();
                tooltip.style.left = `${rect.left + window.scrollX}px`;
                tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
                tooltip.style.display = 'block';
              });

              span.addEventListener('mouseout', () => {
                tooltip.style.display = 'none';
              });
            }
          });
        }
      }
    }
  });

  console.log(`Found ${count} professors.`);
}

// Execute the update
updateTableWithProfessorData().catch(error => console.error(`Error in updateTableWithProfessorData: ${error.message}`));