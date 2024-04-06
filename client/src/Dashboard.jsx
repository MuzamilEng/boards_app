import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setBoardId } from "./store/baordSlice";
import {
  IconCategory,
  IconCloudDownload,
  IconDotsVertical,
} from "@tabler/icons-react";
// Your dashboard component continues here...

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [boardTitle, setBoardTitle] = useState("");
  const [state, setState] = useState();
  const [updateComponent, showUpdateComponent] = useState(false);
  const [value, updateValue] = useState("");
  const [instantData, setInstantData] = useState(false);
  const fetchAllboards = async () => {
    try {
      const boards = await fetch("http://localhost:5000/getAllboards");
      const data = await boards.json();
      setBoards(data);
    } catch (error) {
      console.error("Error during board retrieval:", error);
    }
  };

  const createBoard = async (e) => {
    e.preventDefault();
    try {
      const board = await fetch("http://localhost:5000/create-board", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ boardTitle }),
      });
      const data = await board.json();
      console.log(data, "data mera");
      setBoards([...boards, data]);
      setBoardTitle("");
    } catch (error) {
      console.error("Error during board creation:", error);
    }
  };

  const handleBoardClick = (boardId) => {
    dispatch(setBoardId(boardId));
    console.log(boardId, "boardId in dashboard");
    localStorage.setItem("boardId", boardId);
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
  async function updateTitle(e, id) {
    e.preventDefault();
    const board = await fetch(`http://localhost:5000/updateBoard/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ boardTitle: value }),
    });
    const data = await board.json();
    console.log(data, "updated data");
    updateValue("");
    const boardData = boards.find((board) => board._id === id);
    boardData.boardTitle = data.boardTitle;

    setInstantData(true);
    // console.log(board, "updated board");
    showUpdateComponent(false);
  }

  useEffect(() => {
    fetchAllboards();
  }, []);
  return (
    <>
      <div className="py-[5vw] ">
        <div className=" w-full max-w-[90vw] ml-[5.1vw]  ">
          <div className="">
            <form
              onSubmit={createBoard}
              className="p-[2vw] flex justify-between"
            >
              <input
                type="text"
                placeholder="create Boards"
                value={boardTitle}
                onChange={(e) => setBoardTitle(e.target.value)}
                name="boardTitle"
                className="w-[20vw] p-[0.5vw] border-2 border-blue-600 -ml-[2vw]"
                id=""
              />
              <button
                type="submit"
                className="py-[0.5vw] px-[4vw] bg-blue-300 mr-[-2vw]"
              >
                Create
              </button>
            </form>
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
                  <th className="text-md px-6 py-3 border-r border-solid w-1/6 whitespace-nowrap">
                    DataApp Count
                  </th>
                  <th className="text-md px-6 py-2 border-r border-solid w-1/6 whitespace-nowrap">
                    Job Count
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
                  <th className="text-md px-6 py-2 border-r border-solid w-1/6"></th>{" "}
                  {/* Empty column for the vertical dot icon */}
                </tr>
              </thead>
              <tbody>
                {boards.map((board) => (
                  <tr
                    key={board._id}
                    className="border border-solid border-l border-r"
                  >
                    <td className="text-md px-6 py-2 border-r border-solid hover:cursor-pointer">
                      <Link to={`/board/${board._id}`}>{board.boardTitle}</Link>
                    </td>
                    <td className="text-md px-6 py-2 border-r border-solid">
                      Description
                    </td>
                    <td className="text-md px-6 py-2 border-r border-solid flex gap-[1vw] font-medium text">
                      <div>
                        <IconCategory
                          stroke={1.75}
                          className="text-[#B3C8CF]"
                        />
                      </div>
                      <div className="text-blue-500">Create</div>
                    </td>
                    <td className="text-md px-6 py-2 border-r border-solid font-medium">
                      <div className="flex gap-[1vw]">
                        <div>
                          <IconCategory
                            stroke={1.75}
                            className="text-[#B3C8CF]"
                          />
                        </div>
                        <div className="text-blue-500">Shedule</div>
                      </div>
                    </td>
                    <td className="text-md px-6 py-2 border-r border-solid">
                      afrazrajpoot@gemail.com
                    </td>
                    <td
                      className="text-md px-6 py-2 border-r border-solid"
                      style={{ whiteSpace: "nowrap" }}
                    >
                      {new Date(board.createdAt).toLocaleString()}
                    </td>
                    <td className=" px-6 py-2 border-r border-solid relative hover:cursor-pointer">
                      <IconDotsVertical
                        stroke={1}
                        onClick={() => setState(board._id)}
                      />
                      {state === board._id ? (
                        <div className="bg-[#F6F5F5] py-[2vw] rounded-md shadow-lg px-[1.5vw] absolute right-[3vw]  flex flex-col transition-all duration-200  gap-[0.5vw]">
                          <p
                            className="absolute right-[1vw] top-1 font-bold hover:cursor-pointer"
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
                      ) : (
                        ""
                      )}
                    </td>
                    {updateComponent ? (
                      <section className="w-full h-screen bg-black absolute top-0 left-0 opacity-60">
                        <p
                          className="text-white absolute top-[2vw] right-[2vw] font-bold text-[2vw] hover:cursor-pointer"
                          onClick={() => showUpdateComponent(false)}
                        >
                          X
                        </p>
                        <form
                          className="flex justify-center items-center h-full"
                          onSubmit={(e) => updateTitle(e, board._id)}
                        >
                          <input
                            type="text"
                            placeholder="update"
                            name=""
                            id=""
                            onChange={(e) => updateValue(e.target.value)}
                            className="w-[20vw] p-[0.5vw] border-2 border-blue-600 -ml-[2vw]"
                          />
                        </form>
                      </section>
                    ) : (
                      ""
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
