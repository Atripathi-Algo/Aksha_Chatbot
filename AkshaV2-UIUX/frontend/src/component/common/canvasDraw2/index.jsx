import React, { useState, useEffect } from "react";
import { Stage, Layer, Group, Line, Rect, Image } from "react-konva";
import Konva from "konva";
import useImage from "use-image";
import { coordinatesSelected } from "../../../global_store/reducers/investigationReducer";
import { useDispatch } from "react-redux";

// Main component
const CanvasDraw = ({ imageUrl, setAIPolygen, styleProperities, imagesLength, isClose }) => {
  let dispatch = useDispatch();
  
  // holds the array of points representing the user's selection
  const [points, setPoints] = useState([]);

  // holds the current mouse position
  const [curMousePos, setCurMousePos] = useState([0, 0]);

  // indicates if the mouse is over the start point
  const [isMouseOverStartPoint, setIsMouseOverStartPoint] = useState(false);

  // indicates if the selection is finished
  const [isFinished, setIsFinished] = useState(false);

  // image render function
 

  // On component load function
  useEffect(() => {
    if (isMouseOverStartPoint === true) {
      // sets the AI polygon when the selection is complete
      setAIPolygen(points);
    }
  }, [points, isMouseOverStartPoint]);

  // useEffect hook that runs whenever isClose changes its value
  // If isClose is true, set points and AIPolygen to empty arrays.
  // If isClose is false, set AIPolygen to points, set isMouseOverStartPoint to true,
  useEffect(() => {
    if (isClose) {
      setPoints([])
      setAIPolygen([]);
    }
    else {
      setAIPolygen(points);
      setIsMouseOverStartPoint(true)
      setCurMousePos([0, 0])
      setIsFinished(false)
    }
  }, [isClose])

  // useEffect hook that runs whenever imagesLength, points, or isMouseOverStartPoint changes its value
  // If isClose is false and imagesLength is greater than 1, set points and AIPolygen to empty arrays.
  // If isMouseOverStartPoint is true, set AIPolygen to points.
  useEffect(() => {
    if (!isClose && imagesLength > 1) {
      setPoints([])
      setAIPolygen([]);
    }
    if (isMouseOverStartPoint === true) {
      setAIPolygen(points);
    }
  }, [imagesLength, points, isMouseOverStartPoint])

  // Function that returns the current mouse position on the stage
  const getMousePos = (stage) => {
    return [stage.getPointerPosition().x, stage.getPointerPosition().y];
  };

  // Function that handles click event on the image.
  // Gets the current mouse position and dispatches the action to the store.
  const handleClick = (event) => {
    const stage = event.target.getStage();
    const mousePos = getMousePos(stage);
    dispatch(coordinatesSelected(isMouseOverStartPoint));
    if (isFinished) {
      return;
    }
    if (isMouseOverStartPoint && points.length >= 3) {
      setIsFinished(true);
    } else {
      setPoints([...points, mousePos]);
    }
  };
  
  // This event handler sets the current mouse position and updates it
  const handleMouseMove = (event) => {
    const stage = event.target.getStage();
    const mousePos = getMousePos(stage);
    setCurMousePos(() => mousePos);
  };
  
  // This event handler sets the scale of the start point to 2x if the drawing is not finished and there are at least 3 points
  const handleMouseOverStartPoint = (event) => {
    if (isFinished || points.length < 3) return;
    event.target.scale({ x: 2, y: 2 });

    setIsMouseOverStartPoint(true);
  };
  
  // This event handler sets the scale of the start point back to 1x
  const handleMouseOutStartPoint = (event) => {
    event.target.scale({ x: 1, y: 1 });
    setIsMouseOverStartPoint(false);
  };

  // This event handler logs the start of the drag event to the console
  const handleDragStartPoint = (event) => {
    // console.log("start", event);
  };

  // This event handler updates the points array with the new position of the dragged point
  const handleDragMovePoint = (event) => {
    const index = event.target.index - 1;
    const pos = [event.target.attrs.x, event.target.attrs.y];
    setPoints([...points.slice(0, index), pos, ...points.slice(index + 1)]);
  };

  // This event handler logs the end of the drag event to the console
  const handleDragOutPoint = (event) => {
    // console.log("end", event);
  };
  
  // This event handler logs the end of the drag event to the console
  const handleDragEndPoint = (event) => {
    // console.log("end", event);
  };
  
  // This variable flattens the points array and adds the current mouse position if the drawing is not finished
  const flattenedPoints = points
    .concat(isFinished ? [] : curMousePos)
    .reduce((a, b) => a.concat(b), []);
  // html rendered
  return (
    <>
      <Stage
        width={styleProperities.width ? styleProperities.width : 640}
        height={styleProperities.height ? styleProperities.height : 360}
        onMouseDown={handleClick}
        onMouseMove={handleMouseMove}
        crossorigin="anonymous"
        style={{
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: `${styleProperities.width ? styleProperities.width : '640px'} 360px`,
          backgroundRepeat: "no-repeat",
          height: styleProperities.height ? styleProperities.height : 360,
          width: styleProperities.width ? styleProperities.width : 640,
        }}
      >
        <Layer>
          
          <Line
            points={flattenedPoints}
            stroke="yellow"
            strokeWidth={3}
            closed={isFinished}
          />

          {points.map((point, index) => {
            const width = 6;
            const x = point[0] - width / 2;
            const y = point[1] - width / 2;
            const startPointAttr =
              index === 0
                ? {
                  hitStrokeWidth: 12,
                  onMouseOver: handleMouseOverStartPoint,
                  onMouseOut: handleMouseOutStartPoint,
                }
                : null;
            return (
              <Rect
                key={index}
                x={x}
                y={y}
                width={width}
                height={width}
                fill="white"
                stroke="yellow"
                strokeWidth={3}
                onDragStart={handleDragStartPoint}
                onDragMove={handleDragMovePoint}
                onDragEnd={handleDragEndPoint}
                draggable
                {...startPointAttr}
              />
            );
          })}
        </Layer>
      </Stage>
    </>
  );
};

export default CanvasDraw
