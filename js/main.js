document.addEventListener('DOMContentLoaded', () => {
    let acronymsData = null;

    // Add after existing variables
    const voiceButton = document.getElementById('voiceButton');
    let isListening = false;

    // Add voice recognition setup
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            isListening = true;
            voiceButton.classList.add('is-active');
            voiceButton.querySelector('i').classList.remove('fa-microphone');
            voiceButton.querySelector('i').classList.add('fa-spinner', 'fa-pulse');
        };

        recognition.onend = () => {
            isListening = false;
            voiceButton.classList.remove('is-active');
            voiceButton.querySelector('i').classList.remove('fa-spinner', 'fa-pulse');
            voiceButton.querySelector('i').classList.add('fa-microphone');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            document.getElementById('search').value = transcript;
            searchAcronyms(); // Trigger search automatically
        };

        recognition.onerror = (event) => {
            showError('Voice recognition error: ' + event.error);
            recognition.stop();
        };

        voiceButton.addEventListener('click', () => {
            if (!isListening) {
                recognition.start();
            } else {
                recognition.stop();
            }
        });
    } else {
        voiceButton.style.display = 'none';
        showError('Voice recognition not supported in this browser');
    }

    // Fetch JSON data
    fetch('assets/data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            acronymsData = data;
            showRandomAcronyms(); // Initialize random acronyms
        })
        .catch(error => {
            showError('Failed to load acronyms data. Please try again later.');
        });

    function showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = message;
        errorDiv.classList.remove('is-hidden');
        
        // Hide the error message after 3 seconds
        setTimeout(() => {
            errorDiv.classList.add('is-hidden');
            errorDiv.textContent = '';
        }, 3000);
    }

    function getRandomAcronyms(count = 5) {
        if (!acronymsData || !acronymsData.acronyms.length) return [];
        const shuffled = [...acronymsData.acronyms].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    function showRandomAcronyms() {
        const container = document.getElementById('suggestedAcronyms');
        container.innerHTML = '';
        
        const randomAcronyms = getRandomAcronyms();
        randomAcronyms.forEach(item => {
            const tag = document.createElement('a');
            tag.className = 'tag is-primary is-light is-medium is-clickable';
            tag.textContent = item.acronym;
            tag.addEventListener('click', () => {
                document.getElementById('search').value = item.acronym;
                searchAcronyms();
            });
            container.appendChild(tag);
        });
    }

    function searchAcronyms() {
        // Add this line at the start of the function
        showRandomAcronyms(); // Refresh suggestions on each search

        const searchTerm = document.getElementById('search').value.trim();
        const resultsDiv = document.getElementById('results');
        const errorDiv = document.getElementById('errorMessage');

        resultsDiv.innerHTML = ''; // Clear previous results
        resultsDiv.className = 'columns is-multiline is-centered';
        errorDiv.classList.add('is-hidden'); // Hide previous errors

        if (!searchTerm) {
            showError('Please enter a search term');
            return;
        }

        if (!acronymsData) {
            showError('Data is still loading. Please try again in a moment.');
            return;
        }

        // Create a regex for exact match, case-insensitive
        const regex = new RegExp(`^${escapeRegex(searchTerm)}`, 'i');
        
        // Filter only by acronym for exact match
        const matches = acronymsData.acronyms.filter(item => 
            regex.test(item.acronym)
        );

        if (matches.length === 0) {
            showError(`No results found for "${searchTerm}"`);
            return;
        }

        matches.forEach(item => {
            // Create Bulma card
            const cardColumn = document.createElement('div');
            cardColumn.className = 'column is-two-fifths';

            const card = document.createElement('div');
            card.className = 'card';

            const cardContent = document.createElement('div');
            cardContent.className = 'card-content';

            const media = document.createElement('div');
            media.className = 'media';

            const mediaContent = document.createElement('div');
            mediaContent.className = 'media-content';

            const title = document.createElement('button'); // Changed to button
            title.className = 'button is-link is-inverted is-large'; // Added button classes
            title.textContent = item.acronym;
            title.style.padding = '0.25rem'; // Added padding
            title.style.border = 'none'; // Remove border
            title.style.textAlign = 'left'; // Align text to the left
            title.addEventListener('click', () => {
                window.open(`https://www.google.com/search?q=${encodeURIComponent(item.acronym)}`, '_blank');
            });

            const subtitle = document.createElement('p');
            subtitle.className = 'subtitle is-6';
            subtitle.innerHTML = `<strong>Definition:</strong> ${item.definition}`;

            mediaContent.appendChild(title);
            mediaContent.appendChild(subtitle);
            media.appendChild(mediaContent);
            cardContent.appendChild(media);

            if (item.description) {
                const description = document.createElement('div');
                description.className = 'content';
                description.innerHTML = `<strong>Description:</strong> ${item.description}`;
                cardContent.appendChild(description);
            }

            // Add tags section
            if (item.tags && item.tags.length > 0) {
                const tagsContainer = document.createElement('div');
                tagsContainer.className = 'tags';
                tagsContainer.style.cssText = 'margin: 0.5rem 0 0 0;';
                
                // Split tags if it's a string, or use array directly
                const tagsList = typeof item.tags === 'string' ? 
                    item.tags.split(',').map(t => t.trim()) : 
                    item.tags;
                
                tagsList.filter(tag => tag && tag.length > 0).forEach(tag => {
                    const tagElement = document.createElement('span');
                    tagElement.className = 'tag is-info is-light';
                    tagElement.textContent = tag;
                    tagsContainer.appendChild(tagElement);
                });
                
                cardContent.appendChild(tagsContainer);
            }

            card.appendChild(cardContent);

            const copyButton = document.createElement('button');
            copyButton.className = 'button is-small is-light';
            copyButton.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                border-radius: 4px;
                padding: 5px;
                z-index: 10;
                height: 32px;
                width: 32px;
                transition: background-color 0.3s ease;
            `;
            copyButton.innerHTML = '<span class="icon is-small"><i class="fas fa-clipboard"></i></span>';

            // Add hover effects
            copyButton.addEventListener('mouseenter', () => {
                copyButton.classList.add('is-primary');
            });
            copyButton.addEventListener('mouseleave', () => {
                copyButton.classList.remove('is-primary');
            });

            // Copy functionality (keep existing)
            copyButton.addEventListener('click', () => {
                let copyText = `${item.acronym}: ${item.definition}`;
                if (item.description) {
                    copyText += `\nDescription: ${item.description}`;
                }
                
                navigator.clipboard.writeText(copyText).then(() => {
                    copyButton.classList.add('is-success');
                    copyFeedback.style.opacity = '1';
                    setTimeout(() => {
                        copyButton.classList.remove('is-success');
                        copyFeedback.style.opacity = '0';
                    }, 4000);
                }).catch(err => {
                    showError('Failed to copy text');
                });
            });

            // After creating copyButton, add this code
            const copyFeedback = document.createElement('span');
            copyFeedback.className = 'is-size-7 has-text-danger';
            copyFeedback.style.cssText = `
                position: absolute;
                top: 45px;
                right: 4px;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            copyFeedback.textContent = 'Copied!';

            // Add feedback span after button
            cardContent.appendChild(copyFeedback);

            // Add position relative to card for absolute positioning
            cardContent.style.position = 'relative';
            cardContent.appendChild(copyButton);

            cardColumn.appendChild(card);
            resultsDiv.appendChild(cardColumn);
        });
    }

    // Escape special regex characters in searchTerm
    function escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Add event listener to the search form
    const searchForm = document.getElementById('searchForm');
    searchForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent form from submitting
        searchAcronyms();
    });
});