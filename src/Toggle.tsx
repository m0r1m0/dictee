import { Box, Switch } from "@chakra-ui/react";
import { useState } from "react";

type Props = {
  initialValue: boolean;
  onChange: (value: boolean) => void;
};

export function Toggle({ initialValue, onChange }: Props) {
  const [enable, setEnable] = useState(initialValue);
  return (
    <Box
      display="flex"
      h={"100%"}
      justifyContent={"center"}
      alignItems={"center"}
      mr={"30px"}
      zIndex={1000}
      onClick={() => {
        setEnable((s) => !s);
        onChange(!enable);
      }}
    >
      <Switch
        id="dictee-toggle"
        size={"lg"}
        isChecked={enable}
        transform={"scale(1.5)"}
      />
    </Box>
  );
}
