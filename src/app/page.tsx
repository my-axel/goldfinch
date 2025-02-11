
export default function Home() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-background p-4">Background color</div>
      <div className="bg-foreground text-background p-4">Foreground color as background</div>
      <div className="bg-primary text-primary-foreground p-4">Primary color</div>
      <div className="bg-secondary text-secondary-foreground p-4">Secondary color</div>
      <div className="bg-muted text-muted-foreground p-4">Muted color</div>
      <div className="bg-accent text-accent-foreground p-4">Accent color</div>
    </div>
  );
}
