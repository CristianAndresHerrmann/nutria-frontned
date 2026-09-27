const SIZES = {
  sm: 'size-8 text-[11px]',
  lg: 'size-14 text-lg',
};

function Avatar({ size = 'sm', children }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-mint-100 font-semibold text-mint-700 ${SIZES[size]}`}>
      {children}
    </span>
  );
}

export default Avatar;
