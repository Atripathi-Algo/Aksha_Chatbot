import React, { useState } from "react";
import ReactDOMServer from "react-dom/server";
// import data from "../data";

// The ImageBox component takes in two props: data and aIPolygen
const ImageBox = ({ data, aIPolygen }) => {

  // Set up a state for a list and a function to update it
  const [list, setList] = useState([]);
  
  // Function that encodes a React element as an SVG
  function encodeSvg(reactElement) {
    return (
      "data:image/svg+xml," +
      escape(ReactDOMServer.renderToStaticMarkup(reactElement))
    );
  }
  
  // Function that returns an image element with a SVG image and some polygons
  const getImage = (data) => {
    const image = (
      <svg 
        height="100%" 
        xmlns="http://www.w3.org/2000/svg"
        style={{maxWidth:640}}
      >
        <image href={data["base_url"]} width="100%"  />
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
    return (
      <img
        src={encodeSvg(image)}
        style={{width: "100%",borderRadius:3}}
      />
    );
  };
  
  // The ImageBox component renders an HTML div containing an image
  return (
    <div>
      <div>{getImage(data)}</div>
    </div>
  );
};

// Export the ImageBox component as the default export of this module
export default ImageBox;
