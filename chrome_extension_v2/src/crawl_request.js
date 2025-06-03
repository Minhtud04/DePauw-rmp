import axios from 'axios';

// JSON output file path
const url = 'https://www.ratemyprofessors.com/graphql';
const depauw_id = 'U2Nob29sLTE1MjM=';

// Headers to mimic a browser request
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Content-Type': 'application/json',
};

// GraphQL query template
const query = `query TeacherSearchPaginationQuery(
  $count: Int!
  $cursor: String
  $query: TeacherSearchQuery!
) {
  search: newSearch {
    ...TeacherSearchPagination_search_1jWD3d
  }
}

fragment CardFeedback_teacher on Teacher {
  wouldTakeAgainPercent
  avgDifficulty
}

fragment CardName_teacher on Teacher {
  firstName
  lastName
}

fragment CardSchool_teacher on Teacher {
  department
  school {
    name
    id
  }
}

fragment TeacherBookmark_teacher on Teacher {
  id
  isSaved
}

fragment TeacherCard_teacher on Teacher {
  id
  legacyId
  avgRating
  numRatings
  ...CardFeedback_teacher
  ...CardSchool_teacher
  ...CardName_teacher
  ...TeacherBookmark_teacher
}

fragment TeacherSearchPagination_search_1jWD3d on newSearch {
  teachers(query: $query, first: $count, after: $cursor) {
    didFallback
    edges {
      cursor
      node {
        ...TeacherCard_teacher
        id
        __typename
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
    resultCount
  }
}`;

//Main request with graphQL query
async function fetchProfessorData(count, cursor = '') {
  const payload = {
    query,
    variables: {
      count,
      cursor,
      query: {
        text: '',
        schoolID: depauw_id,
        fallback: true
      }
    }
  };

  try {
    const response = await axios.post(url, payload, { headers });
    return response.data;
  } catch (error) {
    console.error(`Error fetching data: ${error.message}`);
    return null;
  }
}

// Save to extension storage
async function saveDataForExtension(allProfessors) {
  try {
    await chrome.storage.local.set({ 'depauwProfessorsData': allProfessors });
    console.log('Professor data saved to extension storage.');
  } catch (error) {
    console.error('Error saving data to extension storage:', error);
  }
}

async function main_fetch() {
  let allProfessors = [];
  let cursor = '';
  let hasNextPage = true;
  const maxPerPage = 100;

  // Fetch all
  while (hasNextPage) {
    // console.log(`Fetching ${maxPerPage} professors, cursor: ${cursor || 'start'}...`);
    const data = await fetchProfessorData(maxPerPage, cursor);
    
    if (!data || !data.data) {
      console.log('Failed to fetch page data.');
      break;
    }

    const teachers = data.data.search.teachers;
    const edges = teachers.edges;

    for (const edge of edges) {
      const node = edge.node;
      const professor = {
        id: node.id,
        legacyId: node.legacyId,
        firstName: node.firstName,
        lastName: node.lastName,
        department: node.department,
        school: node.school.name,
        avgRating: node.avgRating,
        numRatings: node.numRatings,
        wouldTakeAgainPercent: node.wouldTakeAgainPercent,
        avgDifficulty: node.avgDifficulty,
        isSaved: node.isSaved
      };
      allProfessors.push(professor);
    }

    // Update pagination info
    const pageInfo = teachers.pageInfo;
    hasNextPage = pageInfo.hasNextPage;
    cursor = pageInfo.endCursor;
    // Avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Save to local browser storage
  await saveDataForExtension(allProfessors);
  console.log(`Saved ${allProfessors.length} professors}`);
}


//Listener
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'FETCH_RMP_DATA') {
    main_fetch()
      .then(() => {
        chrome.storage.local.get('depauwProfessorsData', result => {
          sendResponse({ professors: result.depauwProfessorsData });
        });
      })
      .catch(err => sendResponse({ error: err.message }));
    return true; // keep channel open for async sendResponse
  }
});

// Execute main function
//main().catch(error => console.error(`Error in main: ${error.message}`));