'use client'    // Client component

import { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import ResponsiveCarousel from './ResponsiveCarousel';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  showCarousel?: boolean;
  children?: React.ReactNode;
  backgroundStyle?: string;
  allowInteraction?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  showCarousel = false,
  children,
  backgroundStyle = 'bg-black bg-opacity-75',
  allowInteraction = false,
}) => {

  const modalContentRef = useRef<HTMLDivElement>(null);
  
  // Close modal when pressing escape or clicking outside of it
  useEffect(() => {

    const handleEscape = (event: KeyboardEvent) => {
      if (isOpen && event.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        modalContentRef.current &&
        !modalContentRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    window.addEventListener('mousedown', handleClickOutside); 
    return () => {
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Conditional overlay style
  const overlayStyle = allowInteraction ? 'pointer-events-none' : backgroundStyle;

  return isOpen ? ReactDOM.createPortal(
    <div className={`fixed inset-0 flex items-center justify-center ${overlayStyle}`}>
      <div ref={modalContentRef} className="bg-white rounded-lg shadow-lg w-11/12 md:w-3/4 lg:w-2/3 h-5/6 p-4 overflow-y-auto max-w-5xl max-h-[90vh]">
        <button onClick={onClose} className="absolute top-14 right-2 text-white bg-[#303336]
                                              hover:bg-[#48b] hover:border-[#aef] hover:shadow-[0_0_8px_#fff]  font-bold py-2 px-4 rounded">
            Close
        </button>
        <div className="flex flex-col w-full h-full">
            {showCarousel ? <ResponsiveCarousel /> : children}
        </div>
      </div>
    </div>,
    document.body // This is the target container
  ) : null;

};

export default Modal;
