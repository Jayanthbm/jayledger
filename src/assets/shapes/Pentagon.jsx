import Svg, { Path } from 'react-native-svg';

import React from 'react';

const Pentagon = ({ width = 40, height = 40, color = '#6750A4' }) => {
   return (
      <Svg
         width={width}
         height={height}
         viewBox="0 0 315 306"
         fill="none"
      >
         <Path
            d="M122.064 11.459C143.093 -3.81967 171.569 -3.81965 192.598 11.459L289.926 82.1714C310.955 97.45 319.754 124.532 311.722 149.253L274.546 263.668C266.514 288.39 243.476 305.127 217.483 305.127H97.1798C71.1862 305.127 48.1489 288.39 40.1164 263.668L2.9407 149.253C-5.09176 124.532 3.70774 97.45 24.737 82.1714L122.064 11.459Z"
            fill={color}
         />
      </Svg>
   );
};

export default Pentagon;
