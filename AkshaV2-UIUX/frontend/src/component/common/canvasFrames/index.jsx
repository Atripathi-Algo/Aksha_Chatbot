import React, { useState } from "react";
import ReactDOMServer from "react-dom/server";
// import data from "../data";

// Main component
const ImageBox = ({ data, aIPolygen }) => { // define ImageBox component with props data and aIPolygen
  // list of states
  const [list, setList] = useState([]);

  // Encoding svg
  function encodeSvg(reactElement) { // define a function to encode svg element
    return (
      "data:image/svg+xml," + // return the data url
      escape(ReactDOMServer.renderToStaticMarkup(reactElement))
    );
  }

  // Get image function
  const getImage = (data) => { // define a function to get image data
    const image = (
      // Create an SVG element with an image and two polygons
      <svg width="640" height="360" xmlns="http://www.w3.org/2000/svg">
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

    // Return an img element with the encoded SVG as its source and styling
    return (
      <img
        src={encodeSvg(image)}
        style={{
          width: "100%",
          borderRadius: "12px",
        }}
      />
    );
  };
  // html rendered
  return (
    <div>
      <div>{getImage(data)}</div>
    </div>
  );
};

// Export ImageBox component as default
export default ImageBox;
