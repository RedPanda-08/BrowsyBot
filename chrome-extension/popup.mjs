document.addEventListener('DOMContentLoaded', function() {
    const historyContainer = document.getElementById('historyContainer');
    const refreshBtn = document.getElementById('refreshBtn');
    
    // Function to load history from the server
    function loadHistory() {
        // Show loading state
        historyContainer.innerHTML = '<p>Loading history...</p>';

        fetch('http://localhost:3000/history', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('History data received:', data); // Log data received
            displayHistory(data);
        })
        .catch(error => {
            console.error('Error loading history:', error);
            historyContainer.innerHTML = `
                <div style="color: red; padding: 10px;">
                    <p>Error loading history: ${error.message}</p>
                    <p>Please make sure the server is running on http://localhost:3000</p>
                </div>
            `;
        });
    }
    // popup.js
document.addEventListener('DOMContentLoaded', function() {
    fetchHistory();
  });
  
  function fetchHistory() {
    fetch('http://localhost:3000/history')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        displayHistory(data);
      })
      .catch(error => {
        console.error('Error loading history:', error);
        document.getElementById('history-list').innerHTML = 
          '<div class="error">Error loading history. Check if the server is running.</div>';
      });
  }
  
  function displayHistory(historyData) {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';
    
    if (!historyData || historyData.length === 0) {
      historyList.innerHTML = '<div class="no-data">No browsing history available.</div>';
      return;
    }
    
    historyData.forEach(entry => {
      // Try to use timestamp first, then fall back to browser_visited_on
      const timestamp = entry.timestamp || entry.browser_visited_on;
      const date = new Date(timestamp);
      const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
      
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      historyItem.innerHTML = `
        <div class="site-info">
          <a href="${entry.url}" target="_blank">${entry.title || entry.url}</a>
          <span class="visit-time">${formattedDate}</span>
        </div>
      `;
      
      historyList.appendChild(historyItem);
    });
  }
    
    // Function to display history items
    function displayHistory(items) {
        if (!Array.isArray(items)) {
            console.error('Expected array of items, got:', items);
            historyContainer.innerHTML = '<p>Error: Invalid data format</p>';
            return;
        }

        historyContainer.innerHTML = '';
        
        if (items.length === 0) {
            historyContainer.innerHTML = '<p>No history found</p>';
            return;
        }

        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <div><strong>${escapeHtml(item.title || 'No Title')}</strong></div>
                <div>URL:<a href="${escapeHtml(item.url)}" target="_blank">${escapeHtml(item.url)}</a></div>
                ${item.note ? `<div>Note: ${escapeHtml(item.note)}</div>` : ''}
                ${item.tag ? `<div>Tags: ${escapeHtml(item.tag)}</div>` : ''}
            `;
            historyContainer.appendChild(div);
        });
    }
    
    // Function to escape HTML characters
    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Function to save the current tab
    function saveCurrentTab(history) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const tab = tabs[0];
            const url = tab.url;
            const title = tab.title;

            // Check if the URL is already in the history
            const isDuplicate = history.some(item => item.url === url);

            if (!isDuplicate) {
                // Determine tags and notes based on the URL and title
                let tag = 'default-tag';
                let note = 'Automatically added note';

                for (const keyword in keywordMapping) {
                    if (url.includes(keyword) || title.includes(keyword)) {
                        tag = keywordMapping[keyword].tag;
                        note = keywordMapping[keyword].note;
                        break;
                    }
                }

                fetch('http://localhost:3000/save', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ url, title, note, tag })
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Current tab saved:', data);
                    loadHistory();
                })
                .catch(error => {
                    console.error('Error saving current tab:', error);
                });
            } else {
                console.log('Duplicate tab detected, not saving');
            }
        });
    }

    // Load history when popup opens and then save the current tab
    loadHistory();

    // Fetch history first, then save the current tab if it's not a duplicate
    fetch('http://localhost:3000/history', {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(function processResponse(response) { 
        return response.json(); 
      })
    .then(history => saveCurrentTab(history))
    .catch(error => console.error('Error fetching history for duplicate check:', error));

    // Refresh history when button is clicked
    refreshBtn.onclick = loadHistory;
});
