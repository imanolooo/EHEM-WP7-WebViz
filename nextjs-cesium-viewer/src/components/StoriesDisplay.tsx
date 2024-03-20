import React, { useState, useEffect } from 'react';


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

  // Handle next and previous parade
  const handleNextParade = () => {
    setSelectedStory(selectedStory => {
      if (!selectedStory) return null;
      const nextIndex = currentParadeIndex + 1 < selectedStory.parades.length ? currentParadeIndex + 1 : 0;
      setCurrentParadeIndex(nextIndex);
      return selectedStory; // Keep the selected story unchanged
    });
  };

  const handlePrevParade = () => {
    setSelectedStory(selectedStory => {
      if (!selectedStory) return null;
      const prevIndex = currentParadeIndex - 1 >= 0 ? currentParadeIndex - 1 : selectedStory.parades.length - 1;
      setCurrentParadeIndex(prevIndex);
      return selectedStory; // Keep the selected story unchanged
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
                className="mb-2 bg-gray-800 text-white p-2 rounded hover:bg-gray-700 block w-full text-left"
                onClick={() => setSelectedStory(story)}
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
              {/* Navigation buttons for parades */}
              {/*&lt; = left arrow "<"*/}
              {/*&gt; = right arrow ">"*/}
              <button onClick={handlePrevParade} className='bg-gray-800 hover:bg-gray-900 p-1 rounded-lg mt-5'>prev parade</button>
              <button onClick={handleNextParade} className='bg-gray-800 hover:bg-gray-900 p-1 rounded-lg mt-5 ml-1'>next parade</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StoriesDisplay;
