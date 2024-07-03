import { useEffect, useRef, useState } from 'react'
import './App.css'
import avatar from './images/ZJU.jpg'
import _ from 'lodash'
import classNames from 'classnames'
// import { v4 as uuidV4 } from 'uuid'
// import dayjs from 'dayjs'
import axios, { toFormData } from 'axios'
// 当前登录用户信息
const user = {
  // 用户id
  uid: '30009257',
  // 用户头像
  avatar,
  // 用户昵称
  uname: 'aaa',
}
// 导航 Tab 数组
const tabs = [
  { type: 'hot', text: '最热' },
  { type: 'time', text: '最新' },
]

// 封装请求数据的Hook

function useGetList (page,size) {
  // 获取接口数据渲染
  const [commentList, setCommentList] = useState([]);
  const [total,setTotal] = useState(0);
  useEffect(() => {
    async function getList() {
      try {
        const res = await axios.get(`http://localhost:8080/comment/get?page=${page}&size=${size}`);
        if (res.data.code === 0) {
          setCommentList(res.data.data.comments);
          setTotal(res.data.data.total);
        } else {
          console.error('Error fetching comments:', res.data.msg);
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    }
    getList();
  }, [page, size]);

  return {
    commentList,
    setCommentList,
    total
  }
}


// 封装Item组件

function Item ({ item, onDel }) {
  return (
    <div className="reply-item">
      {/* 头像 */}
      <div className="root-reply-avatar">
        <div className="bili-avatar">
          <img
            className="bili-avatar-img"
            alt=""
            src={item.user.avatar}
          />
        </div>
      </div>

      <div className="content-wrap">
        {/* 用户名 */}
        <div className="user-info">
          <div className="user-name">{item.user.uname}</div>
        </div>
        {/* 评论内容 */}
        <div className="root-reply">
          <span className="reply-content">{item.content}</span>
          <div className="reply-info">
            {/* 评论时间 */}
            <span className="reply-time">{item.ctime}</span>
            {/* 评论数量 */}
            <span className="reply-time">点赞数:{item.like}</span>
            {/* 条件：user.id === item.user.id */}
            {user.uid === item.user.uid &&
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
  // 渲染评论列表
  // 1. 使用useState维护list
  // const [commentList, setCommentList] = useState(_.orderBy(list, 'like', 'desc'))
  const [page,setPage] = useState(1);
  const { commentList, setCommentList,total } = useGetList(page,10);
  
  // 删除功能
  const handleDel = (id) => {
    // console.log(id)
    // // 对commentList做过滤处理
    // setCommentList(commentList.filter(item => item.rpid !== id))
    handleDeleteComment(id);
  }
  const handleDeleteComment =async (id)=>{
    try{
      const response = await axios.post('http://localhost:8080/comment/delete', null,{params:{id}});
      if(response.data&&response.data==="success"){
        setCommentList(commentList.filter(item => item.rpid !== id))
      }else{
        console.error('Failed to delete comment:', response.data);
      }
    }catch(error) {
        console.error('Error deleting comment:', error);
      }
  }

  // tab切换功能
  // 1. 点击谁就把谁的type记录下来
  // 2. 通过记录的type和每一项遍历时的type做匹配 控制激活类名的显示
  const [type, setType] = useState('hot')
  const handleTabChange = (type) => {
    console.log(type)
    setType(type)
    // 基于列表的排序
    if (type === 'hot') {
      // 根据点赞数量排序 
      // lodash
      setCommentList(_.orderBy(commentList, 'like', 'desc'))
    } else {
      // 根据创建时间排序
      setCommentList(_.orderBy(commentList, 'ctime', 'desc'))
    }
  }

  // 发表评论
  const [username,setUsername] = useState('')
  const [content, setContent] = useState('')
  const inputRef = useRef(null)
  const handlePublish = async () => {
    if (!username || !content) {
      alert("请填写用户名和评论内容！");
      return;
    }

    // const newComment = {
    //   id: uuidV4(),
    //   user: { uid: user.uid, avatar, uname: username }, // 使用输入的用户名
    //   content,
    //   ctime: dayjs().format('MM-DD hh:mm'),
    //   like: 0,
    // };
    const newComment ={
      name:username,
      content: content,
    };
    try {
      const res = await axios.post('http://localhost:8080/comment/add', newComment);
      if(res.status ===200){
        setCommentList([...commentList, res.data.data]);//TODO
        setUsername(''); // 清空用户名输入框
        setContent('');
        inputRef.current.focus();
      }else{
        console.error('Error adding comment:', res.statusText);
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
        <button onClick={()=>setPage(prev=>prev+1)} disabled={commentList.length>=total} className='loading-button'>
          加载更多
        </button>
      </div>
    </div>
  )
}

export default App
