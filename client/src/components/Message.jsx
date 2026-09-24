const Message = ({ type = "error", children }) =>
  children ? <div className={`message ${type}`}>{children}</div> : null;

export default Message;
