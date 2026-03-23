import { Typography } from "@material-tailwind/react";
import { AvatarUser } from "../ui/AvatarUser";

export const Navbar = () => {
    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

                <Typography variant="h5" className="font-bold text-blue-gray-800">
                    Kinal Sports Admin
                </Typography>

                <AvatarUser />
            </div>
        </nav>
    );
}
