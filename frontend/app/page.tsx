import { ConnectFourBoard } from "@/components/game/ConnectFourBoard";

export default function Home() {
	return (
		<div className="min-h-screen p-8 pb-20 gap-16 sm:p-20">
			<main className="flex flex-col gap-8 items-center">
				<div className="text-center space-y-2">
					<h1 className="text-4xl font-bold">MARL Games</h1>
					<p className="text-muted-foreground">
						Play against trained reinforcement learning agents
					</p>
				</div>

				<ConnectFourBoard />
			</main>
		</div>
	);
}
