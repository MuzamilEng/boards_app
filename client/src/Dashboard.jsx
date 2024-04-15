import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconCloudDownload, IconDotsVertical } from "@tabler/icons-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [boardTitle, setBoardTitle] = useState("");
  const [boardDetails, setBoardDetails] = useState({
    title: "",
    description: "",
  });
  const [createMode, setCreateMode] = useState(false);
  const [state, setState] = useState();
  const [updateComponent, showUpdateComponent] = useState(false);
  const [value, updateValue] = useState("");
  const fetchAllboards = async () => {
    try {
      const boards = await fetch("http://localhost:5000/getAllboards");
      const data = await boards.json();
      setBoards(data);
    } catch (error) {
      console.error("Error during board retrieval:", error);
    }
  };

  const createBoard = () => {
    showUpdateComponent(true);
    setCreateMode(true);
  };

  const handleBoardClick = (boardId) => {
    navigate(`/board/${boardId}`);
  };
  async function deleteBoard(id) {
    const board = await fetch(`http://localhost:5000/deleteBoard/${id}`, {
      method: "DELETE",
    });
    const data = await board.json();
    console.log(data, "data");
    setBoards(boards.filter((board) => board._id !== id));
  }

  const updateTitle = async (e, id) => {
    e.preventDefault();
    const updatedBoardDetails = {
      title: boardDetails.title,
      description: boardDetails.description,
    };

    try {
      if (createMode) {
        console.log("hy by");
        if (!boardDetails.title) {
          alert("Please enter a title");
        }
        if (!boardDetails.description) {
          alert("Please enter a description");
        }
        const board = await fetch("http://localhost:5000/create-board", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            boardTitle: boardDetails.title,
            boardDescription: boardDetails.description,
          }),
        });
        const data = await board.json();
        setBoards([...boards, data]);
        console.log(data);
        setBoardDetails({ title: "", description: "" });
        showUpdateComponent(false);
        setCreateMode(false);
        setState(false);
      } else {
        const board = await fetch(`http://localhost:5000/updateBoard/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedBoardDetails),
        });
        const data = await board.json();
        setBoards(
          boards.map((board) =>
            board._id === id
              ? { ...board, title: data.title, description: data.description }
              : board
          )
        );
        setBoardDetails({ title: "", description: "" });
        showUpdateComponent(false);
        setState(false);
      }
    } catch (error) {
      console.error("Error during board update:", error);
    }
  };

  useEffect(() => {
    fetchAllboards();
  }, []);
  return (
    <>
      <div className="py-[5vw] ">
        <div className=" w-full max-w-[90vw] ml-[5.1vw]  ">
          <div className="">
            <div onClick={createBoard} className="p-[2vw] flex justify-between">
              <button
                // disabled={!boardTitle}
                className="py-[0.5vw] hover:to-blue-400 rounded-md text-white px-[4vw] bg-blue-300 mr-[-2vw]"
              >
                Create
              </button>
            </div>
          </div>
          <div className="pb-[2vw]">
            <table className="w-full">
              <thead>
                <tr className="border border-solid border-l border-r">
                  <th className="text-md px-6 py-2 border-r border-solid w-1/6 text-start whitespace-nowrap">
                    Name
                  </th>
                  <th className="text-md px-6 py-2 border-r border-solid w-1/6 whitespace-nowrap">
                    Description
                  </th>
                  <th className="text-md px-6 py-2 border-r border-solid w-1/6 whitespace-nowrap">
                    Updated by
                  </th>
                  <th className="text-md px-6 py-2 border-r border-solid w-1/6 whitespace-nowrap bg-blue-200">
                    <div className="flex gap-[1vw] ">
                      <p>Updated on</p>
                      <p>
                        <IconCloudDownload stroke={2} />
                      </p>
                    </div>
                  </th>
                  <th className="text-md px-6 py-2 border-r border-solid w-1/6">
                    Actions
                  </th>{" "}
                </tr>
              </thead>
              <tbody>
                {boards.map((board) => (
                  <tr
                    key={board._id}
                    className="border border-solid border-l border-r"
                  >
                    <td className="text-md px-6 py-2 border-r border-solid hover:cursor-pointer">
                      <div onClick={() => handleBoardClick(board?._id)}>
                        {board.title}
                      </div>
                    </td>
                    <td className="text-md px-6 py-2 border-r border-solid">
                      {board?.description || "No description"}
                    </td>
                    <td className="text-md px-6 py-2 border-r border-solid">
                      test@gemail.com
                    </td>
                    <td
                      className="text-md px-6 py-2 border-r border-solid"
                      style={{ whiteSpace: "nowrap" }}
                    >
                      {new Date(board.createdAt).toLocaleString()}
                    </td>
                    <td className=" px-6 py-2 flex items-center justify-center border-r border-solid relative hover:cursor-pointer">
                      <IconDotsVertical
                        stroke={1}
                        onClick={() => setState(board._id)}
                      />
                      {state === board._id && (
                        <div className="bg-[#F6F5F5] z-40 py-[2vw] rounded-md shadow-lg px-[1.5vw] absolute right-[3vw]  flex flex-col transition-all duration-200  gap-[0.5vw]">
                          <p
                            className="absolute right-[1vw] hover:bg-gray-200 w-[2vw] flex items-center justify-center h-[2vw] p-[0.5vw] rounded-md top-1 font-bold hover:cursor-pointer"
                            onClick={() => setState("")}
                          >
                            X
                          </p>
                          <p
                            className="transition-all duration-200 hover:cursor-pointer hover:bg-slate-200 py-[0.5vw] px-[2vw] rounded-md"
                            onClick={() => deleteBoard(board._id)}
                          >
                            Delete
                          </p>
                          <hr />
                          <p
                            className="transition-all duration-200 hover:cursor-pointer hover:bg-slate-200 py-[0.5vw] px-[2vw] text-center rounded-md"
                            onClick={() => showUpdateComponent(true)}
                          >
                            Edit
                          </p>
                        </div>
                      )}
                    </td>
                    {updateComponent && (
                      <main className="w-full z-50 h-screen bg-gray-700 absolute top-0 left-0 opacity-60">
                        <p
                          className="text-white hover:bg-gray-400 rounded-md flex items-center justify-center w-[3vw] h-[3vw] absolute top-[2vw] right-[2vw] font-bold text-[2vw] hover:cursor-pointer"
                          onClick={() => {
                            showUpdateComponent(false);
                            setCreateMode(false);
                          }}
                        >
                          X
                        </p>
                        <section className="flex z-50 justify-center h-full items-center">
                          <form
                            className="bg-[#ffff] p-[3vw] rounded-xl w-[30vw] h-[20vw]"
                            onSubmit={(e) => updateTitle(e, board._id)}
                          >
                            <div className="">
                              <label
                                htmlFor="title"
                                className="text-[1.3vw] font-medium"
                              >
                                Board Title
                              </label>
                              <input
                                type="text"
                                placeholder="enter board title"
                                value={boardDetails?.title}
                                onChange={(e) =>
                                  setBoardDetails({
                                    ...boardDetails,
                                    title: e.target.value,
                                  })
                                }
                                className="w-full p-[0.5vw] text-[1vw] rounded-md border-[1px] border-gray-400 focus:outline-none"
                              />
                            </div>
                            <div className="mt-[2vw]">
                              <label
                                htmlFor="description"
                                className="text-[1.3vw] font-medium"
                              >
                                Board Description
                              </label>
                              <input
                                type="text"
                                placeholder="enter board description"
                                value={boardDetails.description}
                                onChange={(e) =>
                                  setBoardDetails({
                                    ...boardDetails,
                                    description: e.target.value,
                                  })
                                }
                                className="w-full p-[0.5vw] text-[1vw] rounded-md border-[1px] border-gray-400 focus:outline-none"
                              />
                            </div>
                            <button className="w-full p-[0.5vw] text-white text-[1vw] hover:bg-blue-600 bg-blue-500 rounded-md mt-[2vw]">
                              {createMode ? "Create" : "Update"}
                            </button>
                          </form>
                        </section>
                      </main>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
