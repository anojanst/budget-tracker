import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { db } from "@/utils/dbConfig"
import { Budgets, Expenses, Tags } from "@/utils/schema"
import { eq, inArray } from "drizzle-orm"
import { Trash } from "lucide-react"
import { useRouter } from "next/navigation"

function DeleteBudget(props: { budgetId: number }) {
    const { budgetId } = props
    const router = useRouter()

    const deleteBudget = async (budgetId: number) => {
        try {
            const relatedTags = await db
                .select({ id: Tags.id })
                .from(Tags)
                .where(eq(Tags.budgetId, budgetId));

            const tagIds = relatedTags.map(tag => tag.id);

            if (tagIds.length > 0) {
                await db.delete(Expenses).where(inArray(Expenses.tagId, tagIds));
                await db.delete(Tags).where(inArray(Tags.id, tagIds));
            }

            const result = await db.delete(Budgets).where(eq(Budgets.id, budgetId)).returning();

            if (result.length > 0) {
                router.push("/dashboard/budgets");
            }
        } catch (error) {
            console.error("Error deleting budget:", error);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" className="h-8"><Trash /></Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this budget and all related data.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteBudget(budgetId)}>Continue</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export default DeleteBudget