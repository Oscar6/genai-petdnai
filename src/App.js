import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './App.css';

const App = () => {
  const [responseText, setResponseText] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onloadend = () => {
      setUploadedImage(reader.result);
    };

    if (file) {
      reader.readAsDataURL(file);
    }
  };

  const fetchData = async () => {
    try {
      setIsSubmitting(true);
      setIsLoading(true);

      // Convert the uploaded image to base64
      const base64EncodedImage = uploadedImage.split(',')[1];

      // Create GoogleGenerativeAI instance with API key
      const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

      // Prepare prompt and image data
      const prompt = `Identify the dog breed by the image, weight: ${weight} lbs, height: ${height} inches, provided and return a summary of the dog breed provided that is four sentences long. 
        Also, below the summary return the sentence "Here are four possible matching dog breeds:" followed by a numbered list of four different dog breeds that match it. Do not include the indentified breed in the list. Provide an evenly distributed percentage for each dog so that total for the four listed breeds equals 100%. 
          Ex: 
            1. Dog breed A(X%) 
            2. Dog Breed B(X%) 
            3. Dog Breed C(X%) 
            4. Dog Breed D(X%)
            
        If the image provided does not match a dog, return only the following statement "Please only upload images of your pup."`;

      const image = {
        inlineData: {
          data: base64EncodedImage,
          mimeType: 'image/jpeg',
        },
      };

      // Generate content using the model
      const response = await model.generateContent([prompt, image]);
      // Logging the raw response before parsing
      console.log('Raw Model Response:', response);

      // Extracting the text content
      const responseText = response.response.candidates[0].content.parts[0].text;
      console.log('Extracted Text:', responseText);

      // Update state with parsed results
      setResponseText(responseText);
    } catch (error) {
      console.error('Error fetching data:', error);
      setIsSubmitting(false);
    } finally {
      setIsLoading(false); // Hide the "Loading..." message after the request completes
    }
  };

  return (
    <div className='result'>
      <h2 className='resultHeader'>Pet Project</h2>
      {!isSubmitting && (
        <div className='assets'>
          <input className='imgUpload' type="file" accept="image/*" onChange={handleImageUpload} />
          <div className='sizeInputs'>
            <label>
              Weight (lbs):
              <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </label>
            <label>
              Height (in):
              <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} />
            </label>
          </div>
        </div>
      )}

      {!isSubmitting && (
        <button onClick={fetchData} disabled={isSubmitting}>
          Submit
        </button>
      )}

      {uploadedImage && (
        <div className='imageArea'>
          <div className="imageWrapper">
            <img
              src={uploadedImage}
              alt="pet"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover', borderRadius: '8px' }}
            />
          </div>
        </div>
      )}

      {isLoading && <p>Loading...</p>}

      {responseText.length > 0 && (
        <div className='responseText'>
          {/* Split the text into paragraphs and render them */}
          {responseText.split('\n\n').map((paragraph, index) => (
            <div key={index}>
              <p>{paragraph}</p>

              {/* Check if paragraph starts with specific text and render list */}
              {paragraph.startsWith('Here are four') && (
                <div>
                  <ul className="breed-list">
                    {/* Split the paragraph into individual breed items */}
                    {paragraph
                      .split('\n')
                      .slice(2) // remove first two lines
                      .map((item, index) => {
                        const [breed, percentage] = item.split(' (');
                        return (
                          <li key={index}>
                            {index + 1}. {breed} ({percentage.replace(')', '')})
                          </li>
                        );
                      })}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {responseText.length === 0 && responseText !== '' && (
        <p>No matching breeds found.</p>
      )}
    </div>
  );
};

export default App;
