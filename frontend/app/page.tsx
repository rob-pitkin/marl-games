import { ConnectFourBoard } from "@/components/game/ConnectFourBoard";
import { TicTacToeBoard } from "@/components/game/TicTacToeBoard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
	return (
		<div className="min-h-screen p-8 pb-20 gap-16 sm:p-20">
			<main className="flex flex-col gap-8 items-center">
				<div className="text-center space-y-4">
					<h1 className="text-4xl font-bold">MARL Games</h1>
					<p className="text-muted-foreground">
						Play against trained reinforcement learning agents
					</p>
				</div>

				<Tabs defaultValue="connect_four" className="w-full max-w-4xl">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="connect_four">🔴 Connect Four</TabsTrigger>
						<TabsTrigger value="tictactoe">❌ Tic-Tac-Toe</TabsTrigger>
					</TabsList>
					<TabsContent value="connect_four" className="mt-6">
						<ConnectFourBoard />
					</TabsContent>
					<TabsContent value="tictactoe" className="mt-6">
						<TicTacToeBoard />
					</TabsContent>
				</Tabs>
			</main>
		</div>
	);
}
