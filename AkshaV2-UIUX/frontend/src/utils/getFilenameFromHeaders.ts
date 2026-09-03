const getFilenameFromHeaders = (headers: any) => {
  // console.log("headers", headers);
  const contentDisposition = headers['content-disposition'];
  const defaultFilename = `chat_history_${new Date().toISOString()}.zip`;
  if (!contentDisposition) {
    return defaultFilename; // Default filename
  }
  
  const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
  const matches = filenameRegex.exec(contentDisposition);
  if (matches != null && matches[1]) {
    return matches[1].replace(/['"]/g, '');
  }
  return defaultFilename; // Default filename if regex fails
};

export default getFilenameFromHeaders;