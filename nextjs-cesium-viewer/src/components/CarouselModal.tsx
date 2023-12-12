'use client'    // Client component

import { useEffect } from 'react';

interface CarouselModalProps {
    isOpen: boolean;
    onClose: () => void;
    openModal: () => void;
    children?: React.ReactNode; // Make children optional
  }

  const CarouselModal: React.FC<CarouselModalProps> = ({
    isOpen, onClose, openModal, children
  }) => {

    useEffect(() => {
      const handleEscape = (event: KeyboardEvent) => {
        if (isOpen && event.key === 'Escape') {
          onClose();
        }
      };

      const handleClickOutside = (event: MouseEvent) => {
        if (isOpen && event.target === event.currentTarget) {
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

    // Modal styles class names for correct css handling when modal is open/closed.
    const modalStyle = isOpen
    ? 'fixed top-0 left-0 w-full h-full flex justify-center items-center transition-opacity transition-transform'
    : 'hidden';

    const modalOverlayStyle = isOpen
      ? 'fixed top-0 left-0 w-full h-full bg-black bg-opacity-0 opacity-0 scale-95'
      : 'fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 opacity-100 scale-100';

    return (
      <div className={modalStyle}>
        <div className={modalOverlayStyle} />
        <div className="bg-white p-4 rounded-lg shadow-lg relative transform scale-100 transition-transform">
          <button
            className="bg-blue-500 px-4 py-2 rounded-md cursor-pointer absolute top-2 right-2 text-white-600 text-lg focus:outline-none"
            onClick={onClose}
          >
            X
          </button>
          {children}
        </div>
      </div>
    );
};

export default CarouselModal;
