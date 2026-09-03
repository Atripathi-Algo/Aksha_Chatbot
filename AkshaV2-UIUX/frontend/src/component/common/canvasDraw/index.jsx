import React, { useState, useEffect } from "react";
import { Stage, Layer, Line, Rect, Image } from "react-konva";
import useImage from "use-image";
import { coordinatesSelected } from "../../../global_store/reducers/investigationReducer";
import { useDispatch } from "react-redux";

// Main component
const CanvasDraw = ({ imageUrl, setAIPolygen, width, height }) => {
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
  const LionImage = () => {
    const [image] = useImage(imageUrl);
    return <Image image={image} x={0} y={0} width="750" height="400" />;
  };

  // On component load function
  useEffect(() => {
    if (isMouseOverStartPoint === true) {
      // sets the AI polygon when the selection is complete
      setAIPolygen(() => points);
    }
  }, [points, isMouseOverStartPoint]);
  
  // Get mouse position
  const getMousePos = (stage) => {
    return [stage.getPointerPosition().x, stage.getPointerPosition().y];
  };

  // On click on image
  const handleClick = (event) => {
    const stage = event.target.getStage();
    const mousePos = getMousePos(stage);

    // dispatches a Redux action indicating if the mouse is over the start point
    dispatch(coordinatesSelected(isMouseOverStartPoint));
    if (isFinished) {
      // returns if the selection is already finished
      return;
    }
    if (isMouseOverStartPoint && points.length >= 3) {
      // sets isFinished to true if the mouse is over the start point and the user has selected at least 3 points
      setIsFinished(true);
    } else {
      // adds the current mouse position to the list of points
      setPoints([...points, mousePos]);
    }
  };

  // This function handles the mouse movement event and sets the current mouse position
  const handleMouseMove = (event) => {
    const stage = event.target.getStage();
    const mousePos = getMousePos(stage);
    setCurMousePos(() => mousePos);
  };
  
  // This function is called when the mouse is over a point and changes the scale of the point and sets a state variable
  const handleMouseOverStartPoint = (event) => {
    if (isFinished || points.length < 3) return;
    event.target.scale({ x: 2, y: 2 });

    setIsMouseOverStartPoint(true);
  };
  
  // This function is called when the mouse is out of the point and sets the scale back to normal and sets a state variable
  const handleMouseOutStartPoint = (event) => {
    event.target.scale({ x: 1, y: 1 });
    setIsMouseOverStartPoint(false);
  };

  // This function is called when the user starts dragging a point
  const handleDragStartPoint = (event) => {
    // console.log("start", event);
  };

  // This function is called when the user moves a point while dragging it and updates the points array accordingly
  const handleDragMovePoint = (event) => {
    const index = event.target.index - 1;
    const pos = [event.target.attrs.x, event.target.attrs.y];
    setPoints([...points.slice(0, index), pos, ...points.slice(index + 1)]);
  };

  // This function is called when the user drags a point out of the stage
  const handleDragOutPoint = (event) => {
    // console.log("end", event);
  };

  // This function is called when the user finishes dragging a point
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
        width={640}
        height={360}
        onMouseDown={handleClick}
        onMouseMove={handleMouseMove}
        style={{
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: "640px 360px",
          backgroundRepeat: "no-repeat",
        }}
      >
        <Layer>
          {/* <LionImage /> */}
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
export default React.memo(CanvasDraw);