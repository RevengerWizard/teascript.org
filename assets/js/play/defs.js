export const CLOCKID_REALTIME = 0;
export const CLOCKID_MONOTONIC = 1;

export const ERRNO_SUCCESS = 0;
export const ERRNO_ACCES = 2;
export const ERRNO_BADF = 8;
export const ERRNO_INVAL = 28;
export const ERRNO_IO = 29;
export const ERRNO_NAMETOOLONG = 37;
export const ERRNO_NOENT = 44;
export const ERRNO_NOSYS = 52;
export const ERRNO_NOTDIR = 54;
export const ERRNO_NOTSUP = 58;
export const ERRNO_OVERFLOW = 61;
export const ERRNO_SPIPE = 70;

export const EVENTTYPE_CLOCK = 0;
export const EVENTTYPE_FD_READ = 1;
export const EVENTTYPE_FD_WRITE = 2;
export const EVENTRWFLAGS_FD_READWRITE_HANGUP = 1;

export const FDFLAGS_APPEND = 1;
export const FDFLAGS_DSYNC = 2;
export const FDFLAGS_NONBLOCK = 4;
export const FDFLAGS_RSYNC = 8;
export const FDFLAGS_SYNC = 16;

export const FILETYPE_UNKNOWN = 0;
export const FILETYPE_BLOCK_DEVICE = 1;
export const FILETYPE_CHARACTER_DEVICE = 2;
export const FILETYPE_DIRECTORY = 3;
export const FILETYPE_REGULAR_FILE = 4;
export const FILETYPE_SOCKET_STREAM = 6;
export const FILETYPE_SYMBOLIC_LINK = 7;

export const LOOKUPFLAGS_SYMLINK_FOLLOW = 1;
export const PREOPENTYPE_DIR = 0;

export const RIGHTS_FD_READ = 1n << 1n;
export const RIGHTS_FD_SEEK = 1n << 2n;
export const RIGHTS_FD_TELL = 1n << 5n;
export const RIGHTS_FD_WRITE = 1n << 6n;
export const RIGHTS_FD_READDIR = 1n << 14n;
export const RIGHTS_FD_FILESTAT_GET = 1n << 21n;
export const RIGHTS_PATH_CREATE_DIRECTORY = 1n << 9n;
export const RIGHTS_PATH_OPEN = 1n << 13n;
export const RIGHTS_PATH_REMOVE_DIRECTORY = 1n << 25n;
export const RIGHTS_PATH_UNLINK_FILE = 1n << 26n;

export const WHENCE_SET = 0;
export const WHENCE_CUR = 1;
export const WHENCE_END = 2;
