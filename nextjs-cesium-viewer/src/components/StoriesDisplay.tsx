import React, { useState, useEffect, useRef } from 'react';


// Actions based on our discussion, could be extended
// ... other actions
interface Action {
  goto?: string;
  "enable-pois"?: string[];
  "show-side-text"?: string;
  "play-audio"?: string;
  "show-image-interval"?: string[];
  "next-parade"?: string;
  "change-model"?: string;
  "show-html-modal"?: string;
}

interface Parade {
  title: string;
  actions: Action[];
}

interface Story {
  title: string;
  parades: Parade[];
}

const StoriesDisplay: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [currentParadeIndex, setCurrentParadeIndex] = useState(0);
  const [displayContent, setDisplayContent] = useState<string[]>([]);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const timeoutIds = useRef<NodeJS.Timeout[]>([]); // Additional ref to keep track of timeout IDs


  // Toggle collapse state
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Fetch stories.json and update state
  useEffect(() => {
    fetch('/stories.json')
      .then(response => response.json())
      .then(data => setStories(data.stories));
  }, []);

  // Reset parade index when a new story is selected
  useEffect(() => {
    setCurrentParadeIndex(0);
  }, [selectedStory]);

  // Call executeParadeActions when currentParadeIndex changes
  useEffect(() => {
    // Clear any existing timeouts when the selected story or parade index changes
    timeoutIds.current.forEach(clearTimeout);
    timeoutIds.current = []; // Reset the array after clearing timeouts

    if (selectedStory && selectedStory.parades.length > 0) {
      executeParadeActions(selectedStory.parades[currentParadeIndex]);
    } else {
      // If the new selected story has no parades or is null, clear displayed content and image
      setDisplayContent([]);
      setCurrentImageUrl(null);
    }
  }, [selectedStory, currentParadeIndex]);


  // Handle story selection
  const handleStorySelection = (story: Story) => {
    // Toggle off if the same story is reselected
    if (selectedStory === story) {
      setSelectedStory(null);
    } else {
      setSelectedStory(story);
    }
  };

  // Handle next and previous parade
  const handleNextParade = () => {
    setCurrentParadeIndex((currentIndex) =>
      selectedStory ? (currentIndex + 1) % selectedStory.parades.length : 0
    );
  };

  const handlePrevParade = () => {
    setCurrentParadeIndex((currentIndex) =>
      selectedStory ? (currentIndex - 1 + selectedStory.parades.length) % selectedStory.parades.length : 0
    );
  };


  // Helper function to parse time strings "HH:MM:SS" into total seconds
  const parseTime = (timeString: string) => {
    const [hours, minutes, seconds] = timeString.split(':').map(parseFloat);
    return hours * 3600 + minutes * 60 + seconds;
  };

  // Function to execute parade actions
  const executeParadeActions = (parade: Parade) => {
    // Reset content for new parade
    setDisplayContent([]);
    setCurrentImageUrl(null);
  
    // Immediate content (non-images)
    const immediateContent = parade.actions
      .filter(action => !action['show-image-interval'] && action['show-side-text']) // currently retrieving only text and image content
      .map(action => action['show-side-text'] || '') // get the text content as immediate content
      .filter(text => text);
    setDisplayContent(immediateContent);
  
    // Start scheduling image displays based on their actual start times
    parade.actions.filter(action => action['show-image-interval']).forEach(action => {
      const [imageUrl, start, end] = action['show-image-interval'] as string[];
      const startTime = parseTime(start) * 1000;
      const endTime = parseTime(end) * 1000;
      const displayDuration = endTime - startTime;

      const showImageTimeout = setTimeout(() => setCurrentImageUrl(imageUrl), startTime);
      const clearImageTimeout = setTimeout(() => setCurrentImageUrl(null), startTime + displayDuration);

      // Store timeouts so they can be cleared if the story changes
      timeoutIds.current.push(showImageTimeout, clearImageTimeout);
    });
  };

  // Render
  return (
    <div className="absolute top-12 left-2 w-2/5 max-w-md bg-gray-800 bg-opacity-95 border border-gray-700 rounded-lg shadow-lg shadow-black transition-opacity duration-200 ease-out transform opacity-100">
      <button 
        className="w-full bg-gray-700 text-center rounded-t-lg overflow-hidden whitespace-nowrap p-1.5 focus:outline-none"
        onClick={toggleCollapse}
      >
        Stories
      </button>
      {!isCollapsed && (
        <div className="overflow-auto max-h-screen transition-max-height duration-700 ease-in-out" style={{ maxHeight: '752px' }}>

          {/* Select story */}
          <div className="p-4">
            {stories.map((story, index) => (
              <button
                key={index}
                className={`mb-2 p-2 rounded block w-full text-left ${
                  selectedStory === story ? 'bg-gray-700 text-white' : 'bg-gray-800 text-white hover:bg-gray-700'
                }`}
                onClick={() => handleStorySelection(story)}
              >
                {story.title}
              </button>
            ))}
          </div>
            
          {/* Show selected story */}
          {selectedStory && (
            <div className="mt-4 p-4 bg-gray-700 text-white rounded-b-lg">
              <h2 className="text-lg font-bold">{selectedStory.title}</h2>
              <p>{selectedStory.parades[currentParadeIndex]?.title || 'No parade info available'}</p>
              <div>
                {/* Display text content */}
                {displayContent.map((content, index) => (
                  <p key={index}>{content}</p> // For simplicity, displaying as text
                ))}

                {/* Display image content */}
                {currentImageUrl && (
                  <img src={currentImageUrl} alt="current-image" className="w-full h-auto" />
                )}
              </div>
              {/* Navigation buttons for parades */}
              {/*&lt; = left arrow "<"*/}
              {/*&gt; = right arrow ">"*/}
              <div className='flex justify-between'>
                <button onClick={handlePrevParade} className='bg-gray-800 hover:bg-gray-900 mt-6 p-1 rounded-lg'>prev parade</button>
                <button onClick={handleNextParade} className='bg-gray-800 hover:bg-gray-900 mt-6 p-1 rounded-lg'>next parade</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StoriesDisplay;
