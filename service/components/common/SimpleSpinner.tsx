const SimpleSpinner = () => {
  return (
    <div className="flex justify-center items-center">
      <div        
        className="w-5 h-5 border-2 border-primary-100 border-t-transparent rounded-full animate-spin"
      ></div>      
    </div>
  );
};

export default SimpleSpinner;
