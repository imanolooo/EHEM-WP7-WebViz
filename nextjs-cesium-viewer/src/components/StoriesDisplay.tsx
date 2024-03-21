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

const StoriesDisplay = ({ setCameraView }: { setCameraView: any }) => {

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
    fetch('/stories copy.json')
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
    
    parade.actions.forEach((action, index) => {
      // Immediate non-image text content
      if (action['show-side-text']) {
        const textContent = action['show-side-text'];
        setDisplayContent(prevContent => [...prevContent, textContent]);
      }
      
      // Image interval actions
      else if (action['show-image-interval']) {
        const [imageUrl, start, end] = action['show-image-interval'];
        // Convert start and end times to milliseconds for scheduling
        const startTime = parseTime(start) * 1000;
        const endTime = parseTime(end) * 1000;
  
        // Schedule showing the image
        const showImageTimeout = setTimeout(() => setCurrentImageUrl(imageUrl), startTime);
        timeoutIds.current.push(showImageTimeout);
  
        // Schedule clearing the image after its display duration
        const clearImageTimeout = setTimeout(() => setCurrentImageUrl(null), endTime);
        timeoutIds.current.push(clearImageTimeout);
      }
      
      // Handle 'goto' camera movement actions
      else if (action.goto) {
        fetch(`./${action.goto}`)
          .then(response => response.json())
          .then(cameraConfig => {
            // Delay applying camera view to align with narrative, if necessary
            const gotoTimeout = setTimeout(() => {
              setCameraView(cameraConfig);
            }, 500); 
            timeoutIds.current.push(gotoTimeout);
          });
      }
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
                className={`mb-1 pt-0 pb-0 btn-sm rounded block w-full text-left ${
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
              <h3 className="font-bold">{selectedStory.parades[currentParadeIndex]?.title || 'No parade info available'}</h3>
              <div>
                {/* Display text content */}
                {displayContent.map((content, index) => (
                  //<p key={index}>{content}</p> // For simplicity, displaying as text
                  <p key={index}> <span dangerouslySetInnerHTML={{__html: content }} /> </p> // Displaying as HTML

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
