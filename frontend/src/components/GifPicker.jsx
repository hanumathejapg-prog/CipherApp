import React, { useState } from 'react';
import { GiphyFetch } from '@giphy/js-fetch-api';

const GifPicker = ({ isOpen, onClose, onSelectGif }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);

  const gf = new GiphyFetch(process.env.REACT_APP_GIPHY_API_KEY || 'sXpW9q5b5V4J5oH3RVrjqWB8BdXD69s0');

  const searchGifs = async (query) => {
    if (!query.trim()) {
      setGifs([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await gf.search(query, { limit: 20 });
      setGifs(data);
    } catch (error) {
      console.error('Error fetching GIFs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchTerm(query);
    searchGifs(query);
  };

  const handleSelectGif = (gif) => {
    const gifUrl = gif.images.fixed_height.url || gif.images.original.url;
    console.log('Sending GIF URL:', gifUrl);
    onSelectGif(gifUrl);
    setSearchTerm('');
    setGifs([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="gif-picker-modal" onClick={onClose}>
      <div className="gif-picker-content" onClick={(e) => e.stopPropagation()}>
        <div className="gif-picker-header">
          <h3>Select a GIF</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="gif-picker-search">
          <input
            type="text"
            placeholder="Search GIFs..."
            value={searchTerm}
            onChange={handleSearch}
            autoFocus
          />
        </div>
        <div className="gif-picker-grid">
          {loading && <p className="loading">Loading GIFs...</p>}
          {gifs.length === 0 && !loading && searchTerm && (
            <p className="no-results">No GIFs found</p>
          )}
          {gifs.map((gif) => (
            <div
              key={gif.id}
              className="gif-item"
              onClick={() => handleSelectGif(gif)}
            >
              <img src={gif.images.fixed_height.url} alt={gif.title} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GifPicker;
