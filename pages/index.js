import React, { useState, useEffect, useRef } from 'react';

// --- Helper Components ---

// This component represents a single die
const Die = ({ value, isFrozen, onClick, onDragStart, onDragOver, onDrop, onDragEnd, isDragging, isDragOver }) => (
  <div
    className={`w-20 h-20 flex justify-center items-center text-5xl rounded-2xl cursor-pointer transition-all duration-300 shadow-md hover:scale-110 hover:shadow-lg
      ${isFrozen 
        ? 'bg-blue-100 ring-2 ring-blue-500 scale-105' 
        : 'bg-white'
      }
      ${isDragging ? 'opacity-50 scale-110 shadow-2xl rotate-3' : ''}
      ${isDragOver ? 'border-2 border-dashed border-blue-500 bg-blue-50' : ''}
    `}
    onClick={onClick}
    draggable="true"
    onDragStart={onDragStart}
    onDragOver={onDragOver}
    onDrop={onDrop}
    onDragEnd={onDragEnd}
  >
    {!isDragOver && value}
  </div>
);

// This component is the custom-styled dropdown select (label is now handled by the parent)
const StyledSelect = ({ options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ref]);

  const selectedLabel = options.find(opt => opt.value === value)?.label || value;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="font-['Nunito',sans-serif] inline-flex items-center justify-between w-32 rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedLabel}
        <svg className="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-full rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {options.map(option => (
              <a
                key={option.value}
                href="#"
                className="font-['Nunito',sans-serif] text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100"
                onClick={(e) => {
                  e.preventDefault();
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// This component is the toggle switch for advanced options
const ToggleSwitch = ({ isEnabled, onChange }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input type="checkbox" checked={isEnabled} onChange={onChange} className="sr-only peer" />
    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
  </label>
);


// --- Main App Component ---

export default function App() {
  // --- State Management ---
  const [numDice, setNumDice] = useState(5);
  const [dice, setDice] = useState([]); 
  const [frozenIds, setFrozenIds] = useState(new Set());
  const [currentRoll, setCurrentRoll] = useState(0);
  const [maxRolls, setMaxRolls] = useState(Infinity);
  const [isRolling, setIsRolling] = useState(false);
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [score, setScore] = useState(0);
  const [theme, setTheme] = useState('Default');
  
  // Advanced Options State
  const [showOptions, setShowOptions] = useState(false);
  const [limitEnabled, setLimitEnabled] = useState(false);
  const [maxRollsSelection, setMaxRollsSelection] = useState('3');
  const [customMaxRolls, setCustomMaxRolls] = useState(10);

  const diceFaces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  
  const themes = {
    Default: 'from-indigo-500 to-purple-600',
    Ocean: 'from-cyan-500 to-blue-500',
    Sunset: 'from-red-500 to-yellow-500',
  };

  // --- Drag and Drop Logic ---
  const handleDragStart = (id) => setDraggedId(id);
  const handleDragOver = (e) => e.preventDefault();
  const handleDragEnter = (id) => { if (draggedId !== id) setDragOverId(id); };
  const handleDragEnd = () => { setDraggedId(null); setDragOverId(null); };
  const handleDrop = (targetId) => {
    if (draggedId === null || draggedId === targetId) { handleDragEnd(); return; }
    const draggedIndex = dice.findIndex(d => d.id === draggedId);
    const targetIndex = dice.findIndex(d => d.id === targetId);
    const newDice = [...dice];
    const [draggedItem] = newDice.splice(draggedIndex, 1);
    newDice.splice(targetIndex, 0, draggedItem);
    setDice(newDice);
    handleDragEnd();
  };

  // --- Game Logic Functions ---
  const calculateScore = (currentDice) => {
    const total = currentDice.reduce((sum, d) => sum + d.value + 1, 0);
    setScore(total);
  };

  const startNewGame = () => {
    let newMaxRolls = Infinity;
    if (limitEnabled) {
      newMaxRolls = maxRollsSelection === 'other' ? parseInt(customMaxRolls) || 10 : parseInt(maxRollsSelection);
    }
    setMaxRolls(newMaxRolls);
    
    const initialDice = Array.from({ length: numDice }, (_, i) => ({ id: i, value: Math.floor(Math.random() * 6) }));
    setDice(initialDice);
    setFrozenIds(new Set());
    setCurrentRoll(0);
    setIsRolling(false);
    calculateScore(initialDice);
  };

  const rollDice = () => {
    if (currentRoll >= maxRolls) return;

    setIsRolling(true);
    setCurrentRoll(prev => prev + 1);

    let tempDice = [...dice];
    const rollingInterval = setInterval(() => {
      tempDice = tempDice.map(d => frozenIds.has(d.id) ? d : { ...d, value: Math.floor(Math.random() * 6) });
      setDice(tempDice);
    }, 80);

    setTimeout(() => {
      clearInterval(rollingInterval);
      const finalDice = dice.map(d => frozenIds.has(d.id) ? d : { ...d, value: Math.floor(Math.random() * 6) });
      setDice(finalDice);
      calculateScore(finalDice);
      setIsRolling(false);
    }, 1000);
  };

  const toggleFreeze = (id) => {
    // Freezing is only allowed after the first roll and when not rolling.
    if (isRolling || currentRoll === 0) return;
    setFrozenIds(prevIds => {
      const newIds = new Set(prevIds);
      newIds.has(id) ? newIds.delete(id) : newIds.add(id);
      return newIds;
    });
  };

  // --- Effects ---
  useEffect(() => {
    startNewGame();
  }, [numDice, limitEnabled, maxRollsSelection, customMaxRolls]);

  // --- Render ---
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap" rel="stylesheet" />

      <div className={`min-h-screen flex items-center justify-center p-4 font-['Nunito',sans-serif] bg-gradient-to-br ${themes[theme]}`}>
        <div className="w-full max-w-2xl bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center">
          
          <h1 className="text-5xl font-bold text-gray-800 mb-2">Roll the Dice</h1>
          
          <div className="text-lg text-gray-600 font-semibold mb-1 min-h-[28px]">
            {maxRolls === Infinity ? `Roll: ${currentRoll}` : `Roll: ${currentRoll} / ${maxRolls}`}
          </div>
          <div className="text-lg text-gray-600 font-semibold mb-6 min-h-[28px]">
            Total Score: {score}
          </div>

          <div className="mb-6 flex justify-center">
            <div className="flex items-center">
              <label className="text-gray-700 mr-3">Number of Dice:</label>
              <StyledSelect
                options={[1, 2, 3, 4, 5, 6].map(n => ({ value: n, label: String(n) }))}
                value={numDice}
                onChange={(value) => setNumDice(Number(value))}
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 min-h-[100px] mb-8" onDragOver={handleDragOver}>
            {dice.map((d) => (
              <div key={d.id} onDragEnter={() => handleDragEnter(d.id)} onDrop={() => handleDrop(d.id)}>
                  <Die 
                    value={diceFaces[d.value]} 
                    isFrozen={frozenIds.has(d.id)}
                    onClick={() => toggleFreeze(d.id)}
                    onDragStart={() => handleDragStart(d.id)}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedId === d.id}
                    isDragOver={dragOverId === d.id}
                  />
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-4 mb-4">
            <button 
              onClick={rollDice}
              disabled={isRolling || currentRoll >= maxRolls}
              className="px-8 py-3 text-lg font-semibold text-white bg-indigo-600 rounded-full shadow-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
            >
              Roll the Dice
            </button>
            {limitEnabled && (
              <button 
                onClick={startNewGame}
                className="px-8 py-3 text-lg font-semibold text-white bg-indigo-600 rounded-full shadow-lg hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105"
              >
                New Game
              </button>
            )}
          </div>
          
          <a onClick={() => setShowOptions(!showOptions)} className="text-gray-500 cursor-pointer hover:text-gray-800 transition">
            Options {showOptions ? '▴' : '▾'}
          </a>

          {showOptions && (
            <div className="bg-gray-100 rounded-lg p-4 mt-4 text-left space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-gray-700">Enable Roll Limit</label>
                <ToggleSwitch isEnabled={limitEnabled} onChange={() => setLimitEnabled(!limitEnabled)} />
              </div>
              {limitEnabled && (
                <>
                  <div className="flex justify-between items-center">
                     <label className="text-gray-700">Max Rolls</label>
                     <StyledSelect
                        options={[{ value: '3', label: '3' }, { value: 'other', label: 'Other...' }]}
                        value={maxRollsSelection}
                        onChange={(value) => setMaxRollsSelection(value)}
                      />
                  </div>
                  {maxRollsSelection === 'other' && (
                    <div className="flex justify-between items-center mt-2">
                      <label htmlFor="customMaxRollsInput" className="text-gray-700">Custom Max:</label>
                      <input type="number" id="customMaxRollsInput" value={customMaxRolls} onChange={(e) => setCustomMaxRolls(Number(e.target.value))} className="w-24 p-2 rounded-lg border border-gray-300 font-['Nunito',sans-serif]" min="1"/>
                    </div>
                  )}
                </>
              )}
               <div className="flex justify-between items-center pt-2 border-t mt-3">
                 <label className="text-gray-700">Theme</label>
                 <StyledSelect
                    options={Object.keys(themes).map(t => ({ value: t, label: t }))}
                    value={theme}
                    onChange={(value) => setTheme(value)}
                  />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
