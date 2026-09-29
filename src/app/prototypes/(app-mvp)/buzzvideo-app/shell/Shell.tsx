import App from "../app/App";
import { AppProvider } from "../app/provider";

export default function Shell() {
  return (
    <AppProvider>
      <div className="flex min-h-screen items-center justify-center bg-[#f4f1ee]">
        <div className="flex h-[844px] w-[390px] flex-col overflow-hidden rounded-[44px] border-[10px] border-[#111]">
          <App />
        </div>
      </div>
    </AppProvider>
  );
}
