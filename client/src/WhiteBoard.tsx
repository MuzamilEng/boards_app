import {
  useMutation,
  RoomProvider,
  useHistory,
  useStorage,
  useSelf,
  useOthersMapped,
  useCanUndo,
  useCanRedo,
} from "../liveblocks.config";
import { ClientSideSuspense } from "@liveblocks/react";
import { LiveList, LiveMap, LiveObject } from "@liveblocks/client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Color,
  Layer,
  LayerType,
  CanvasState,
  CanvasMode,
  Camera,
  Side,
  XYWH,
  Point,
} from "./types";
import {
  colorToCss,
  connectionIdToColor,
  findIntersectingLayersWithRectangle,
  penPointsToPathLayer,
  pointerEventToCanvasPoint,
  resizeBounds,
} from "./utils";
import { ReactNode } from "react";
import SelectionBox from "./components/SelectionBox";
import { nanoid } from "nanoid";
import { useParams } from 'react-router-dom';
import Draggable from 'react-draggable';
import LayerComponent from "./components/LayerComponent";
import SelectionTools from "./components/SelectionTools";
import useDisableScrollBounce from "./hooks/useDisableScrollBounce";
import useDeleteLayers from "./hooks/useDeleteLayers";
import MultiplayerGuides from "./components/MultiplayerGuides";
import Path from "./components/Path";
import ToolsBar from "./components/ToolsBar";
import { sidebarInfo } from "./Data";
import {Icon} from "@iconify/react";

const MAX_LAYERS = 100;

export default function Room() {
  
  const {id} = useParams();
  const roomId = useExampleRoomId(id?.toString() || "");


  return (
    <RoomProvider
      id={roomId}
      initialPresence={{
        selection: [],
        cursor: null,
        pencilDraft: null,
        penColor: null,
      }}
      initialStorage={{
        layers: new LiveMap<string, LiveObject<Layer>>(),
        layerIds: new LiveList(),
      }}
    >
      <div className='container'>
        <ClientSideSuspense fallback={<Loading />}>
          {() => <Canvas />}
        </ClientSideSuspense>
      </div>
    </RoomProvider>
  );
}

function Loading() {
  return (
    <div className='container'>
      <div className='loading'>
        <img src="https://liveblocks.io/loading.svg" alt="Loading" />
      </div>
    </div>
  );
}

function Canvas() {
  const layerIds = useStorage((root) => root.layerIds);

  const pencilDraft = useSelf((me) => me.presence.pencilDraft);
  const [canvasState, setState] = useState<CanvasState>({
    mode: CanvasMode.None,
  });
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0 });
  const [lastUsedColor, setLastUsedColor] = useState<Color>({
    r: 252,
    g: 142,
    b: 42,
  });
  const history = useHistory();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  useDisableScrollBounce();

  const deleteLayers = useDeleteLayers();

  /**
   * Hook used to listen to Undo / Redo and delete selected layers
   */
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case "Backspace": {
          deleteLayers();
          break;
        }
        case "z": {
          if (e.ctrlKey || e.metaKey) {
            if (e.shiftKey) {
              history.redo();
            } else {
              history.undo();
            }
            break;
          }
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [deleteLayers, history]);

  /**
   * Select the layer if not already selected and start translating the selection
   */
  const onLayerPointerDown = useMutation(
    ({ self, setMyPresence }, e: React.PointerEvent, layerId: string) => {
      if (
        canvasState.mode === CanvasMode.Pencil ||
        canvasState.mode === CanvasMode.Inserting
      ) {
        return;
      }

      history.pause();
      e.stopPropagation();
      const point = pointerEventToCanvasPoint(e, camera);
      if (!self.presence.selection.includes(layerId)) {
        setMyPresence({ selection: [layerId] }, { addToHistory: true });
      }
      setState({ mode: CanvasMode.Translating, current: point });
    },
    [setState, camera, history, canvasState.mode]
  );

  /**
   * Start resizing the layer
   */
  const onResizeHandlePointerDown = useCallback(
    (corner: Side, initialBounds: XYWH) => {
      history.pause();
      setState({
        mode: CanvasMode.Resizing,
        initialBounds,
        corner,
      });
    },
    [history]
  );

  /**
   * Insert an ellipse or a rectangle at the given position and select it
   */
  const insertLayer = useMutation(
    (
      { storage, setMyPresence },
      layerType: LayerType.Ellipse | LayerType.Rectangle,
      position: Point
    ) => {
      const liveLayers = storage.get("layers");
      if (liveLayers.size >= MAX_LAYERS) {
        return;
      }

      const liveLayerIds = storage.get("layerIds");
      const layerId = nanoid();
      const layer = new LiveObject({
        type: layerType,
        x: position.x,
        y: position.y,
        height: 100,
        width: 100,
        fill: lastUsedColor,
      });
      liveLayerIds.push(layerId);
      liveLayers.set(layerId, layer);

      setMyPresence({ selection: [layerId] }, { addToHistory: true });
      setState({ mode: CanvasMode.None });
    },
    [lastUsedColor]
  );

  /**
   * Transform the drawing of the current user in a layer and reset the presence to delete the draft.
   */
  const insertPath = useMutation(
    ({ storage, self, setMyPresence }) => {
      const liveLayers = storage.get("layers");
      const { pencilDraft } = self.presence;
      if (
        pencilDraft == null ||
        pencilDraft.length < 2 ||
        liveLayers.size >= MAX_LAYERS
      ) {
        setMyPresence({ pencilDraft: null });
        return;
      }

      const id = nanoid();
      liveLayers.set(
        id,
        new LiveObject(penPointsToPathLayer(pencilDraft, lastUsedColor))
      );

      const liveLayerIds = storage.get("layerIds");
      liveLayerIds.push(id);
      setMyPresence({ pencilDraft: null });
      setState({ mode: CanvasMode.Pencil });
    },
    [lastUsedColor]
  );

  /**
   * Move selected layers on the canvas
   */
  const translateSelectedLayers = useMutation(
    ({ storage, self }, point: Point) => {
      if (canvasState.mode !== CanvasMode.Translating) {
        return;
      }

      const offset = {
        x: point.x - canvasState.current.x,
        y: point.y - canvasState.current.y,
      };

      const liveLayers = storage.get("layers");
      for (const id of self.presence.selection) {
        const layer = liveLayers.get(id);
        if (layer) {
          layer.update({
            x: layer.get("x") + offset.x,
            y: layer.get("y") + offset.y,
          });
        }
      }

      setState({ mode: CanvasMode.Translating, current: point });
    },
    [canvasState]
  );

  /**
   * Resize selected layer. Only resizing a single layer is allowed.
   */
  const resizeSelectedLayer = useMutation(
    ({ storage, self }, point: Point) => {
      if (canvasState.mode !== CanvasMode.Resizing) {
        return;
      }

      const bounds = resizeBounds(
        canvasState.initialBounds,
        canvasState.corner,
        point
      );

      const liveLayers = storage.get("layers");
      const layer = liveLayers.get(self.presence.selection[0]);
      if (layer) {
        layer.update(bounds);
      }
    },
    [canvasState]
  );

  const unselectLayers = useMutation(({ self, setMyPresence }) => {
    if (self.presence.selection.length > 0) {
      setMyPresence({ selection: [] }, { addToHistory: true });
    }
  }, []);

  /**
   * Insert the first path point and start drawing with the pencil
   */
  const startDrawing = useMutation(
    ({ setMyPresence }, point: Point, pressure: number) => {
      setMyPresence({
        pencilDraft: [[point.x, point.y, pressure]],
        penColor: lastUsedColor,
      });
    },
    [lastUsedColor]
  );

  /**
   * Continue the drawing and send the current draft to other users in the room
   */
  const continueDrawing = useMutation(
    ({ self, setMyPresence }, point: Point, e: React.PointerEvent) => {
      const { pencilDraft } = self.presence;
      if (
        canvasState.mode !== CanvasMode.Pencil ||
        e.buttons !== 1 ||
        pencilDraft == null
      ) {
        return;
      }

      setMyPresence({
        cursor: point,
        pencilDraft:
          pencilDraft.length === 1 &&
          pencilDraft[0][0] === point.x &&
          pencilDraft[0][1] === point.y
            ? pencilDraft
            : [...pencilDraft, [point.x, point.y, e.pressure]],
      });
    },
    [canvasState.mode]
  );

  /**
   * Start multiselection with the selection net if the pointer move enough since pressed
   */
  const startMultiSelection = useCallback((current: Point, origin: Point) => {
    // If the distance between the pointer position and the pointer position when it was pressed
    if (Math.abs(current.x - origin.x) + Math.abs(current.y - origin.y) > 5) {
      // Start multi selection
      setState({
        mode: CanvasMode.SelectionNet,
        origin,
        current,
      });
    }
  }, []);

  /**
   * Update the position of the selection net and select the layers accordingly
   */
  const updateSelectionNet = useMutation(
    ({ storage, setMyPresence }, current: Point, origin: Point) => {
      const layers = storage.get("layers").toImmutable();
      setState({
        mode: CanvasMode.SelectionNet,
        origin: origin,
        current,
      });
      const ids = findIntersectingLayersWithRectangle(
        layerIds,
        layers,
        origin,
        current
      );
      setMyPresence({ selection: ids });
    },
    [layerIds]
  );

  const selections = useOthersMapped((other) => other.presence.selection);

  /**
   * Create a map layerId to color based on the selection of all the users in the room
   */
  const layerIdsToColorSelection = useMemo(() => {
    const layerIdsToColorSelection: Record<string, string> = {};

    for (const user of selections) {
      const [connectionId, selection] = user;
      for (const layerId of selection) {
        layerIdsToColorSelection[layerId] = connectionIdToColor(connectionId);
      }
    }

    return layerIdsToColorSelection;
  }, [selections]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    // Pan the camera based on the wheel delta
    setCamera((camera) => ({
      x: camera.x - e.deltaX,
      y: camera.y - e.deltaY,
    }));
  }, []);

  const onPointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      const point = pointerEventToCanvasPoint(e, camera);

      if (canvasState.mode === CanvasMode.Inserting) {
        return;
      }

      if (canvasState.mode === CanvasMode.Pencil) {
        startDrawing(point, e.pressure);
        return;
      }

      setState({ origin: point, mode: CanvasMode.Pressing });
    },
    [camera, canvasState.mode, setState, startDrawing]
  );

  const onPointerMove = useMutation(
    ({ setMyPresence }, e: React.PointerEvent) => {
      e.preventDefault();
      const current = pointerEventToCanvasPoint(e, camera);
      if (canvasState.mode === CanvasMode.Pressing) {
        startMultiSelection(current, canvasState.origin);
      } else if (canvasState.mode === CanvasMode.SelectionNet) {
        updateSelectionNet(current, canvasState.origin);
      } else if (canvasState.mode === CanvasMode.Translating) {
        translateSelectedLayers(current);
      } else if (canvasState.mode === CanvasMode.Resizing) {
        resizeSelectedLayer(current);
      } else if (canvasState.mode === CanvasMode.Pencil) {
        continueDrawing(current, e);
      }
      setMyPresence({ cursor: current });
    },
    [
      camera,
      canvasState,
      continueDrawing,
      resizeSelectedLayer,
      startMultiSelection,
      translateSelectedLayers,
      updateSelectionNet,
    ]
  );

  const onPointerLeave = useMutation(
    ({ setMyPresence }) => setMyPresence({ cursor: null }),
    []
  );

  const onPointerUp = useMutation(
    ({}, e) => {
      const point = pointerEventToCanvasPoint(e, camera);

      if (
        canvasState.mode === CanvasMode.None ||
        canvasState.mode === CanvasMode.Pressing
      ) {
        unselectLayers();
        setState({
          mode: CanvasMode.None,
        });
      } else if (canvasState.mode === CanvasMode.Pencil) {
        insertPath();
      } else if (canvasState.mode === CanvasMode.Inserting) {
        insertLayer(canvasState.layerType, point);
      } else {
        setState({
          mode: CanvasMode.None,
        });
      }
      history.resume();
    },
    [
      camera,
      canvasState,
      history,
      insertLayer,
      insertPath,
      setState,
      unselectLayers,
    ]
  );

  const [searchImage, setSearchImages] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showCancelBtn, setShowCancelButton] = useState(false)
  
  const toggleDropdown = (title: string) => {
    setOpenDropdown(openDropdown === title ? null : title);
  };
      
  const handleSearchImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value.toLowerCase();
    setSearchImages(searchTerm);
    
    // Check if the searched image exists in any dropdown items
    const foundDropdown = sidebarInfo.find(category => 
      category.items.some(item => item.name.toLowerCase().includes(searchTerm))
    );
    
    if (foundDropdown) {
      setOpenDropdown(foundDropdown.title);
    } else {
      setOpenDropdown(null);
    }
  };
  
  const filterImages = sidebarInfo?.flatMap(category => category.items)
  .filter(item => item.name.toLowerCase().includes(searchImage));

// console.log(filterImages, "filterImages");

const handleImageSelect = (imageUrl: string) => {
  setSelectedImages(prevImages => [...prevImages, imageUrl]);
};

const removeImage = (indexToRemove: number) => {
  setSelectedImages(prevImages => prevImages.filter((_, index) => index !== indexToRemove));
};

  return (
    <>
      <div className='canvas bg-white relative h-full w-screen'>
      <div className="absolute top-[2vw] left-[30vw] cursor-pointer w-full max-w-[5vw]">
        {selectedImages.map((image, index) => (
          <div key={index}>
            <Draggable>
              <section className="relative">
                {showCancelBtn && <p className="p-[0.5vw] absolute top-0 right-0 cursor-pointer flex items-center justify-center bg-[#383737] w-[1vw] h-[1vw] text-white text-center rounded-full text-[0.7vw]" onClick={() => removeImage(index)}>x</p>}
                <img onClick={()=> setShowCancelButton(true)}  src={image} alt={`Selected image ${index}`} className="w-full" />
              </section>
            </Draggable>
          </div>
        ))}
      </div>
      <div className="absolute bg-white  w-full max-w-[21.5vw] shadow-lg rounded-lg  p-[1vw] left-0 top-[7vw] h-[40vw]">
        <nav className="flex items-center p-[0.7vw] rounded-full bg-gray-100">
          <Icon icon="charm:search" className="text-[1.3vw] text-gray-500" />
          <input type="text" placeholder="Search..." onChange={handleSearchImage} className="w-full ml-[0.5vw] text-[1vw] border-none focus:outline-none bg-inherit" />
        </nav>
        <aside className="mt-[1vw] w-full p-[0.5vw] scrollbar-hide overflow-y-scroll h-[25vw]">
        {searchImage && (
        <div className="w-full">
          <div className="w-full mb-[0.5vw]">
            <figure>
             {filterImages[0]?.img && <img src={filterImages[0]?.img} onClick={() => handleImageSelect(filterImages[0]?.img)} alt={filterImages[0]?.name} className="w-[2vw] cursor-pointer h-[2vw] m-[0.5vw]" />}
              <span className="text-[0.8vw] w-[3vw] text-center">{filterImages[0]?.name}</span>
            </figure>
          </div>
        </div>
      )}
       {sidebarInfo?.map((item, index) => (
    <div className="w-full" key={index}>
      <p className="text-[1vw] hover:bg-slate-50 border-b-[0.1vw] p-[0.3vw] flex justify-between items-center font-bold text-gray-500 mb-[0.5vw] cursor-pointer" onClick={() => toggleDropdown(item?.title)}>
        <span>{item.title}</span>
        <Icon icon="ep:arrow-down-bold" className="text-[1vw] text-gray-700" />
      </p>
      {openDropdown === item.title && (
        <div className="grid grid-cols-2 gap-[1vw] w-full">
          {item.items.map((imageItem, imageIndex) => (
            <figure key={imageIndex}>
              <img src={imageItem?.img} onClick={() => handleImageSelect(imageItem?.img)} alt={imageItem?.name} className="w-[2vw] cursor-pointer h-[2vw] m-[0.5vw]" />
              <span className="text-[0.8vw] w-[3vw] text-center">{imageItem?.name}</span>
            </figure>
          ))}
        </div>
      )}
    </div>
     ))}
    </aside>
    <div className="-mt-[1vw] ml-[5vw]">
        {/* <Draggable> */}
              <section className="relative w-full max-w-[7vw]" onClick={()=> setSelectedImages([...selectedImages, '/logo.png'])}>
                <img  src={'/logo.png'} alt={`Selected image`} className="w-full" />
              </section>
            {/* </Draggable> */}
        </div>
      </div>
        <SelectionTools
          isAnimated={
            canvasState.mode !== CanvasMode.Translating &&
            canvasState.mode !== CanvasMode.Resizing
          }
          camera={camera}
          setLastUsedColor={setLastUsedColor}
        />
       <div className="">
         <svg
          className='renderer_svg'
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          onPointerUp={onPointerUp}
        >
          <g
            style={{
              transform: `translate(${camera.x}px, ${camera.y}px)`,
            }}
          >
            {layerIds?.map((layerId) => (
              <LayerComponent
                key={layerId}
                id={layerId}
                mode={canvasState.mode}
                onLayerPointerDown={onLayerPointerDown}
                selectionColor={layerIdsToColorSelection[layerId]}
              />
            ))}
            {/* Blue square that show the selection of the current users. Also contains the resize handles. */}
            <SelectionBox
              onResizeHandlePointerDown={onResizeHandlePointerDown}
            />
            {/* Selection net that appears when the user is selecting multiple layers at once */}
            {canvasState.mode === CanvasMode.SelectionNet &&
              canvasState.current != null && (
                <rect
                  className='selection_net'
                  x={Math.min(canvasState.origin.x, canvasState.current.x)}
                  y={Math.min(canvasState.origin.y, canvasState.current.y)}
                  width={Math.abs(canvasState.origin.x - canvasState.current.x)}
                  height={Math.abs(
                    canvasState.origin.y - canvasState.current.y
                  )}
                />
              )}
            <MultiplayerGuides />
            {/* Drawing in progress. Still not commited to the storage. */}
            {pencilDraft != null && pencilDraft.length > 0 && (
              <Path
                points={pencilDraft}
                fill={colorToCss(lastUsedColor)}
                x={0}
                y={0}
              />
            )}
          </g>
        </svg>
       </div>
      </div>
      <ToolsBar
        canvasState={canvasState}
        setCanvasState={setState}
        undo={history.undo}
        redo={history.redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
    </>
  );
}

/**
 * This function is used when deploying an example on liveblocks.io.
 * You can ignore it completely if you run the example locally.
 */
function useExampleRoomId(roomId: string) {

  
  const exampleRoomId = useMemo(() => {
    return roomId ? roomId : "acdeehbhb";
  }, [roomId]);

  return exampleRoomId;
}
