import { useEffect, useRef, useState ,useMemo} from 'react';
import './App.css';
import avatar from './images/ZJU.jpg';
import _ from 'lodash';
import classNames from 'classnames';
import axios from 'axios';

// const user = {
//   uid: '30009257',
//   avatar,
//   uname: 'aaa',
// };

const tabs = [
  { type: 'hot', text: '最热' },
  { type: 'time', text: '最新' },
];

function useGetList(page, size) {
  const [commentList, setCommentList] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const getList = async () => {
      try {
        const res = await axios.get(`http://localhost:8080/comment/get?page=${page}&size=${size}`);
        if (res.code === 0) {
          setCommentList(res.data.comments);
          setTotal(res.data.total);
        } else {
          throw new Error(res.msg);
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    };
    getList();
  }, [page, size]);

  return { commentList, setCommentList, total };
}

// 封装Item组件

function Item ({ item, onDel }) {
  const randomLikes = Math.floor(Math.random() * 100);
  const randomTime = useMemo(() => {
    // 随机生成一个时间戳，例如从当前时间往前推1年内的随机时间
    const now = new Date().getTime();
    const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
    return oneYearAgo + Math.random() * (now - oneYearAgo);
  }, []);

  // 将时间戳转换为可读的日期格式
  const readableTime = new Date(randomTime).toLocaleString();
  return (
    <div className="reply-item">
      {/* 头像 */}
      <div className="comment-id">{item.id}</div>
      <div className="root-reply-avatar">
        <div className="bili-avatar">
          <img
            className="bili-avatar-img"
            alt=""
            src={avatar}
          />
        </div>
      </div>

      <div className="content-wrap">
        {/* 用户名 */}
        <div className="user-info">
          <div className="user-name">{item.name}</div>
        </div>
        {/* 评论内容 */}
        <div className="root-reply">
          <span className="reply-content">{item.content}</span>
          <div className="reply-info">
            {/* 评论时间 */}
            <span className="reply-time">{readableTime}</span>
            {/* 评论数量 */}
            <span className="reply-time">点赞数:{randomLikes}</span>
            {
              <span className="delete-btn" onClick={() => onDel(item.rpid)}>
                删除
              </span>}
          </div>
        </div>
      </div>
    </div>
  )
}


const App = () => {
  const [page, setPage] = useState(1);
  const { commentList, setCommentList, total } = useGetList(page, 10);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(total / 10);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      setPage(newPage); // 更新页面状态以重新获取数据
    }
  };

  const handleDel = (id) => {
    handleDeleteComment(id);
  };

  const handleDeleteComment = async (id) => {
    try {
      const response = await axios.delete(`http://localhost:8080/comment/delete/${id}`);
      if (response.data.code === 0) {
        setCommentList(commentList.filter((item) => item.id !== id));
      } else {
        throw new Error(response.data.msg || 'Delete failed');
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleTabChange = (type) => {
    setType(type);
    // 更新排序逻辑，确保使用正确的字段进行排序
    setCommentList(_.orderBy(commentList, type === 'hot' ? 'like' : 'ctime', 'desc'));
  };

  const [type, setType] = useState('hot');
  const [username, setUsername] = useState('');
  const [content, setContent] = useState('');
  const inputRef = useRef(null);

  const handlePublish = async () => {
    if (!username || !content) {
      alert('请填写用户名和评论内容！');
      return;
    }
    try {
      const newComment = {
        name: username,
        content: content,
      };
      const res = await axios.post('http://localhost:8080/comment/add', newComment);
      if (res.data.code === 0) { // 假设服务器响应的数据格式中，code字段表示状态
        setCommentList([...commentList, res.data.data]);
        setUsername(''); // 清空用户名输入框
        setContent('');
        inputRef.current.focus();
      } else {
        console.error('Error adding comment:', res.data.msg);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };
  return (
    <div className="app">
      {/* 导航 Tab */}
      <div className="reply-navigation">
        <ul className="nav-bar">
          <li className="nav-title">
            <span className="nav-title-text">评论</span>
            {/* 评论数量 */}
            <span className="total-reply">{total}</span>
          </li>
          <li className="nav-sort">
            {/* 高亮类名： active */}
            {tabs.map(item =>
              <span
                key={item.type}
                onClick={() => handleTabChange(item.type)}
                className={classNames('nav-item', { active: type === item.type })}>
                {item.text}
              </span>)}
          </li>
        </ul>
      </div>

      <div className="reply-wrap">
        {/* 发表评论 */}
        <div className="box-normal">
          {/* 当前用户头像 */}
          <div className="reply-box-avatar">
            <div className="bili-avatar">
              <img className="bili-avatar-img" src={avatar} alt="用户头像" />
            </div>
          </div>
          <div className="reply-box-wrap">
            {/* 评论框 */}
            <input
              type="text"
              className="reply-box-username"
              placeholder="用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <textarea
              className="reply-box-textarea"
              placeholder="发一条友善的评论"
              ref={inputRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            {/* 发布按钮 */}
            <div className="reply-box-send">
              <div className="send-text" onClick={handlePublish}>发布</div>
            </div>
          </div>
        </div>
        {/* 评论列表 */}
        <div className="reply-list">
          {/* 评论项 */}
          {commentList.map(item => <Item key={item.id} item={item} onDel={handleDel} />)}
        </div>
        {/*加载按钮 置于页面底部 TODO:perv*/}
        <div className="pagination" style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            上一页
          </button>
          <span>
            第{currentPage}页 / 共{totalPages}页
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={commentList.length >= total}
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
