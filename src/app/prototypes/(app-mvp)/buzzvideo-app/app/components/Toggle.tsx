import { Switch } from "react-native";
import { colors } from "../theme";

type Props = { value: boolean; onValueChange: (v: boolean) => void; accessibilityLabel?: string; disabled?: boolean };

// react-native-web 的 Switch 另有 activeThumbColor(默认青绿色),原生端忽略这个属性
const webThumb = { activeThumbColor: colors.white } as object;

/** iOS 开关:选中轨道为橙色,滑块始终白色 */
export default function Toggle({ value, onValueChange, accessibilityLabel, disabled }: Props) {
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      trackColor={{ false: colors.systemFill, true: colors.accent }}
      thumbColor={colors.white}
      {...webThumb}
    />
  );
}
