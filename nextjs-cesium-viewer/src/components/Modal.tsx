'use client'    // Client component

import { useEffect, useRef, useState } from 'react';
import ResponsiveCarousel from './ResponsiveCarousel';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    openModal: () => void;
    selectedPhase?: string | null;
    children?: React.ReactNode; // Make children optional
  }

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, openModal, selectedPhase, children }) => {

  const modalContentRef = useRef<HTMLDivElement>(null);
  
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

  return (
    <div className={`fixed inset-0 ${isOpen ? 'flex' : 'hidden'} items-center justify-center bg-black bg-opacity-75`}>
      <div ref={modalContentRef} className="bg-white rounded-lg shadow-lg w-11/12 md:w-3/4 lg:w-2/3 h-5/6 p-4 overflow-y-auto max-w-5xl max-h-[90vh]">
          <button onClick={onClose} className="absolute top-2 right-2 text-white bg-blue-500 hover:bg-blue-700 font-bold py-2 px-4 rounded">
              Close
          </button>
          <div className="flex flex-col w-full h-full">
              <ResponsiveCarousel selectedPhase={selectedPhase} />    
          </div>
      </div>
  </div>
  );

};

export default Modal;
