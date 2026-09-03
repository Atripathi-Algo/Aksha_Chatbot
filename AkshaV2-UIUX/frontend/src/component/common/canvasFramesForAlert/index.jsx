import React, { useState } from "react";
import ReactDOMServer from "react-dom/server";
// import data from "../data";

// Defining a functional component called ImageBox with props data and aIPolygen
const ImageBox = ({ data, aIPolygen }) => {
  
  // Defining a state called list with an empty array as its initial value
  const [list, setList] = useState([]);
  
  // Defining a function called encodeSvg that encodes a given reactElement into a svg image format
  function encodeSvg(reactElement) {
    return (
      "data:image/svg+xml," +
      escape(ReactDOMServer.renderToStaticMarkup(reactElement))
    );
  }
  
  // Defining a function called getImage that takes in data as a parameter and returns an img element
  const getImage = (data) => {

    // Defining a svg image
    const image = (
      <svg 
        height={360}
        width={640} 
        xmlns="http://www.w3.org/2000/svg"
      >
        <image 
          href={data["base_url"]} 
          width="100%" 
        />
        <polygon
          points={data["Results"]}
          style={{ fill: "transparent", stroke: "blue", strokeWidth: 4 }}
        />

        <polygon
          points={aIPolygen}
          style={{ fill: "transparent", stroke: "yellow", strokeWidth: 4 }}
        />
      </svg>
    );

    // Returning an img element with the encoded svg image and some styles
    return (
      <img
        src={encodeSvg(image)}
        style={{
          width: "100%",
          // borderRadius: "12px",
        }}
      />
    );
  };
  

  // Rendering a div element with the image obtained from getImage function
  return (
    <div>
      <div>{getImage(data)}</div>
    </div>
  );
};

// Exporting the component as default
export default ImageBox;
