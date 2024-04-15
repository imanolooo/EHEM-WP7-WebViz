import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { phasesInfo} from './Phases';

// Actions based on our discussion, could be extended
// ... other actions
interface Action {
  goto?: string;
  "enable-pois"?: string[];
  "show-side-text"?: string;
  "show-graphic-material"?: string;
  "play-audio"?: string;
  "show-image-interval"?: string[];
  "change-model"?: string;
  "show-html-modal"?: string;
  "next-parade"?: string;
}

interface Parade {
  title: string;
  actions: Action[];
}

interface Story {
  title: string;
  parades: Parade[];
}

interface StoriesDisplayProps {
  setCameraView: any;
  loadModel: any;
  setGMmodal: any;
  setGMimage: any;
  setCurrentImage: any;
  onPoisEnabled: (pois: string[]) => void;
}

const StoriesDisplay = ({ setCameraView, loadModel, setGMmodal, setGMimage, setCurrentImage, onPoisEnabled }: StoriesDisplayProps) => {

  const [isCollapsed, setIsCollapsed] = useState(true);
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [currentParadeIndex, setCurrentParadeIndex] = useState(0);
  const [displayContent, setDisplayContent] = useState<string[]>([]);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const timeoutIds = useRef<NodeJS.Timeout[]>([]); // Additional ref to keep track of timeout IDs
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalHtmlContent, setModalHtmlContent] = useState('');
  const [isHoveringTitles, setIsHoveringTitles] = useState(false);
  const audioRef = useRef(new Audio());
  const playPauseButtonRef = useRef(null);
  const muteButtonRef = useRef(null);

  // Handle mouse enter and leave for story titles area
  const handleMouseEnter = () => setIsHoveringTitles(true);
  const handleMouseLeave = () => setIsHoveringTitles(false);

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
      onPoisEnabled([]);
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

  // Helper function to stop audio and clean up when component unmounts
  useEffect(() => {
    return () => {
      audioRef.current.pause();
      audioRef.current.src = ''; // Clear the source
    };
  }, []);

  // Audio play/pause and mute/unmute text changing
  useEffect(() => {
    const playHandler = () => {
      if (playPauseButtonRef.current) (playPauseButtonRef.current as HTMLButtonElement).textContent = 'Pause Audio';
    };
    
    const pauseHandler = () => {
      if (playPauseButtonRef.current) (playPauseButtonRef.current as HTMLButtonElement).textContent = 'Play Audio';
    };

    const volumeChangeHandler = () => {
      if (muteButtonRef.current) (muteButtonRef.current as HTMLButtonElement).textContent = audioRef.current.muted ? 'Unmute' : 'Mute';
    };
    
    const audioCurrent = audioRef.current;
  
    // Event Listeners
    audioCurrent.addEventListener('play', playHandler);
    audioCurrent.addEventListener('pause', pauseHandler);
    audioCurrent.addEventListener('volumechange', volumeChangeHandler);

    // Cleanup
    return () => {
      audioCurrent.removeEventListener('play', playHandler);
      audioCurrent.removeEventListener('pause', pauseHandler);
      audioCurrent.removeEventListener('volumechange', volumeChangeHandler);
    };
  }, []);

  // Audio play/pause functionality
  const togglePlayPause = () => {
    if (audioRef.current.src) {
      if (!audioRef.current.paused) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(error => console.error("Audio play failed:", error));
      }
    }
  };

  // Audio mute/unmute functionality
  const toggleMute = () => {
    audioRef.current.muted = !audioRef.current.muted;
  };

  // Function to execute parade actions
  const executeParadeActions = (parade: Parade) => {
    // Reset content for new parade
    setDisplayContent([]);
    setCurrentImageUrl(null);
    console.log('Executing parade actions:', parade);
    if (!parade) 
    { 
        console.log('ERROR: No parade to execute actions for.');      
        return;
    }
    parade.actions.forEach((action, index) => {
      // Immediate non-image text content
      if (action['show-side-text']) {
        const textContent = action['show-side-text'];
        setDisplayContent(prevContent => [...prevContent, textContent]);
      }

      if (action['show-graphic-material']) {
        const textContent = action['show-graphic-material'];
        setGMmodal(true);
        console.log('show-graphic-material:', action['show-graphic-material']);
        setGMimage(textContent);
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

      // Handle 'enable-pois' action
      else if (action['enable-pois']) {
        onPoisEnabled(action['enable-pois']);
      }

      else if (action['change-model']) {
        var century = action['change-model'];
        if (century == 'IX') loadModel(phasesInfo[0].id);
        else if (century == 'X') loadModel(phasesInfo[1].id);
        else if (century == 'XI') loadModel(phasesInfo[2].id);
        else if (century == 'XII') loadModel(phasesInfo[3].id);
        else if (century == 'XIII') loadModel(phasesInfo[4].id);
        else if (century == 'XXI') loadModel(phasesInfo[5].id);
      }


      // Handle 'show-html-modal' action
      else if (action['show-html-modal']) {
        setModalHtmlContent(action['show-html-modal']);
        setIsModalOpen(true);
      }

      // Handle 'next-parade' action
      // it's working, but there needs to be some extra condition,
      // else it will keep on going to the next parade infinitely
      // example for 2s delay. Add this to any parade action: {"next-parade": "true"} 

      //> core 'next-parade' code
      // else if (action['next-parade'] && action['next-parade'] === 'true') {
      //   handleNextParade();
      // } 

      else if (action['next-parade'] && action['next-parade'] === 'true') {
        setTimeout(() => {
          handleNextParade();
        }, 2000); 
      }
 
      // Handle 'play-audio' action
      else if (action['play-audio']) {
        const audioFile = action['play-audio'];
        const audioSource = `/${audioFile}`; // /public/file-name.mp3
        audioRef.current.src = audioSource;
        audioRef.current.loop = false;
        audioRef.current.play().catch(error => console.error('Failed to play audio:', error));
      }
    });
  };

  // Render
  return (
    <div className="absolute top-12 left-2 w-2/5 max-w-md bg-gray-800 bg-opacity-95 border border-gray-700 rounded-lg shadow-lg shadow-black transition-opacity duration-200 ease-out transform opacity-100">
      <button 
        className="w-full bg-gray-700 text-white text-center rounded-t-lg overflow-hidden whitespace-nowrap p-1.5 focus:outline-none"
        onClick={toggleCollapse}
      >
        Stories
      </button>
      {!isCollapsed && (
        <div className="overflow-auto max-h-screen transition-max-height duration-700 ease-in-out" style={{ maxHeight: '752px' }} >
          {/* Select story */}
          <div className="p-4" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} >
            {((!selectedStory || isHoveringTitles) ? stories : [selectedStory]).map((story, index) => (
              story.title[1]!="." || story.title[0]=="C" || story.title[0]=="Ω"?  
                <button
                  key={index}
                  className={`mb-1 pt-0 pb-0 btn-sm rounded block w-full text-left ${
                    selectedStory === story ? 'bg-gray-700 text-white' : 'bg-gray-800 text-white hover:bg-gray-700'
                  }`}
                  onClick={() => {
                    handleStorySelection(story);
                    setIsHoveringTitles(false);
                  }}
                >
                  {story.title} 
                </button>
              : 
              <button  // Disabled button for top-level stories
                  key={index}
                  className={`mb-1 pt-0 pb-0 btn-sm rounded block w-full text-left disabled bg-gray-800 text-white hover:bg-gray-800`}
                  disabled={true}
                  onClick={() => {
                    // setIsHoveringTitles(false);
                  }}
                >
                  {story.title} 
                </button>
            ))}
          </div>
            
          {/* Show selected story */}
          {selectedStory && (
            <div className="mt-4 p-4 bg-gray-700 text-white rounded-b-lg">
              <h2 className="text-lg font-bold">{selectedStory.title}</h2>

               {/* Navigation buttons for parades */}
              {/*&lt; = left arrow "<"*/}
              {/*&gt; = right arrow ">"*/}
              <div className='flex justify-between'>
                {currentParadeIndex == 0? 
                <button className='bg-gray-800 text-gray-500 mt-6 p-1 rounded-lg' disabled={true}> prev parade</button>
                : <button onClick={handlePrevParade} className='bg-gray-800 hover:bg-gray-900 mt-6 p-1 rounded-lg'>prev parade</button>
                }
                <button className='bg-gray-800 mt-6 p-1 rounded-lg' disabled={true}>
                Parade {currentParadeIndex + 1} of {selectedStory.parades.length}
                </button>
                {currentParadeIndex < selectedStory.parades.length - 1 ?
                <button onClick={handleNextParade} className='bg-gray-800 hover:bg-gray-900 mt-6 p-1 rounded-lg'>next parade</button>
                :
                <button onClick={handleNextParade} className='bg-gray-800 text-gray-500 mt-6 p-1 rounded-lg' disabled={true}>next parade</button>
                }
              </div>
              <br></br>

              <h3 className="font-bold">{selectedStory.parades[currentParadeIndex]?.title || 'No parade info available'}</h3>
              <div>
                {/* Display text content */}
                {displayContent.map((content, index) => (
                  //<p key={index}>{content}</p> // display as text
                  <p key={index}> <span dangerouslySetInnerHTML={{__html: content }} /> </p> // Displaying as HTML

                ))}

               

                {/* Display image content */}
                {currentImageUrl && (
                  <img src={currentImageUrl} alt="current-image" className="w-full h-auto" />
                )}

                 {/* Audio player */}
                 <button ref={playPauseButtonRef} onClick={togglePlayPause} className='bg-gray-800 hover:bg-gray-900 mt-6 mr-2 p-1 rounded-lg'>
                  Play Audio
                </button>
                <button ref={muteButtonRef} onClick={toggleMute} className='bg-gray-800 hover:bg-gray-900 mt-6 p-1 rounded-lg'>
                  Mute
                </button>

              </div>

              {/* Modal for displaying HTML content */}
              <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                backgroundStyle='bg-opacity-50 bg-black'
                allowInteraction={false}
                currentImage={null}
                setCurrentImage={null}
              >
                <div className='text-black' dangerouslySetInnerHTML={{ __html: modalHtmlContent }} />
              </Modal>

             
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StoriesDisplay;
