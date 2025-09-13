"use client";

import { useNavStore } from "@/store/navZustand";
import {
  Avatar,
  Button,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
} from "@heroui/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  RectangleGroupIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  TruckIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  UserGroupIcon,
  ArrowLeftEndOnRectangleIcon,
  BuildingStorefrontIcon,
  ArrowsUpDownIcon,
  ArrowUturnLeftIcon,
  CubeTransparentIcon,
  CircleStackIcon,
  CpuChipIcon
} from "@heroicons/react/24/outline";

import { useAuthStore } from "@/store/authZustand";

export function Navbar() {
  const { isMenuOpen, toggleMenu, closeMenu } = useNavStore();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const routes = [
    { name: "Dashboard", path: "/sistema/dashboard", icon: RectangleGroupIcon },
    { name: "Clientes", path: "/sistema/clientes", icon: UsersIcon },
    {
      name: "Ordens de Serviço",
      path: "/sistema/ordens",
      icon: WrenchScrewdriverIcon,
    },
    {
      name: "Estoque",
      path: "/sistema/estoque",
      icon: CubeTransparentIcon,
    },
    {
      name: "Vendas",
      path: "/sistema/vendas",
      icon: CircleStackIcon,
    },
    {
      name: "Fornecedores",
      path: "/sistema/fornecedores",
      icon: TruckIcon,
    },

    { name: "Usuários", path: "/sistema/usuarios", icon: UserGroupIcon },
    { name: "Logs", path: "/sistema/logs", icon: Cog6ToothIcon },
    { name: "Lojas", path: "/sistema/lojas", icon: BuildingStorefrontIcon },
    {
      name: "Transferência",
      path: "/sistema/transferencia",
      icon: ArrowsUpDownIcon,
    },
    {
      name: "Devoluções",
      path: "/sistema/devolucoes",
      icon: ArrowUturnLeftIcon,
    },
    {
      name: "RMA",
      path: "/sistema/rma",
      icon: CpuChipIcon,
    }
  ];

  const getButtonVariant = (href: string) => {
    return href === pathname ? "faded" : "light";
  };

  if (!mounted) {
    return (
      <>
        {/* Navbar skeleton durante a hidratação */}
        <nav
          className="fixed top-0 left-0 z-30 h-screen dark:bg-black bg-white
           border-r dark:border-gray-800 border-gray-200
         w-64 -translate-x-full transition-transform duration-300 ease-in-out"
        >
          <div className="border-b dark:border-gray-800 border-gray-200 flex gap-2 items-center p-4">
            <div className="w-10 h-10 bg-black/50 rounded-lg flex items-center justify-center">
              <img src="/logo.png" alt="LogSys Logo" className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <h1 className="font-semibold">LogSys</h1>
              <h1 className="text-sm">Assistência Técnica</h1>
            </div>
          </div>
        </nav>
        <header className="border-b dark:border-gray-800 border-gray-200 h-16 fixed top-0 z-10  left-0 w-full transition-all duration-300 ease-in-out">
          <div className="flex items-center h-full gap-1 px-4">
            <button className="">
              <Bars3Icon className="w-6 h-6" />
            </button>
            <h1 className="text-sm sm:text-base dark:text-white text-gray-500 font-medium">
              Sistema ERP - Assistência Técnica
            </h1>
          </div>
        </header>
      </>
    );
  }

  return (
    <>
      {/* Overlay para mobile apenas */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20  z-30 lg:hidden backdrop-blur-sm"
          onClick={closeMenu}
        />
      )}

      {/* Sidebar */}
      <nav
        className={`
          fixed top-0 left-0 z-30 h-screen border-r border-default bg-white dark:bg-black 
          w-64
          ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}
          transition-transform duration-300 ease-in-out
        `}
      >
        <div className="border-b border-default flex gap-2 items-center p-4">
          <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
            <img src="/logo.png" alt="LogSys Logo" className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-semibold">LogSys</h1>
            <h1 className="text-sm">Assistência Técnica</h1>
          </div>
        </div>

        {/* Menu items */}
        <div className="p-4 space-y-1">
          <div>
          <h1 className="text-sm font-semibold dark:text-white text-gray-500 
          ">Navegação Principal</h1>
          </div>
          {routes.map((route) => (
            <Button
              key={route.name}
              variant={getButtonVariant(route.path)}
              href={route.path}
              className="w-full justify-start text-left rounded-md"
              onPress={() => router.push(route.path)}
              startContent={<route.icon className="w-5 h-5" />}
            >
              {route.name}
            </Button>
          ))}
        </div>
        {/* Footer */}
        <div className="absolute bottom-0 left-0 w-full p-4 flex flex-col gap-4">
          <Divider />
          <h1 className="flex items-center gap-2 text-sm text-gray-500 dark:text-white">
            <span>
              <div className="w-2 h-2 bg-green-500 rounded-full -mt-0.5"></div>
            </span>
            Sistema Online
          </h1>
        </div>
      </nav>

      {/* Header */}
      <header
        className={`
          border-b border-default h-16 fixed top-0 z-10 dark:bg-black bg-white z-20
          left-0 w-full
          ${isMenuOpen ? "lg:left-64 lg:w-[calc(100%-16rem)]" : "lg:left-0 lg:w-full"}
          transition-all duration-300 ease-in-out
        `}
      >
        <div className="flex justify-between items-center h-full gap-1 px-4">
          <div className="flex items-center gap-2">
            <Button
              isIconOnly
              variant="light"
              onPress={toggleMenu}
              aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
              className="min-w-unit-10 w-unit-10 h-unit-10"
            >
              {isMenuOpen ? (
                <XMarkIcon className="w-6 h-6 transition-transform duration-300" />
              ) : (
                <Bars3Icon className="w-6 h-6 transition-transform duration-300" />
              )}
            </Button>
            <h1 className="text-sm sm:text-base font-medium text-gray-500 dark:text-white">
              Sistema ERP
              <span className="hidden sm:inline text-gray-500 dark:text-gray-400">
                {" "}
                - Assistência Técnica
              </span>
            </h1>
          </div>

          <Dropdown
            placement="bottom-end"
            classNames={{
              base: "before:bg-default-200",
              content: "py-1 px-1 border-2 border-default-200 ",
            }}
          >
            <DropdownTrigger>
              <Avatar
                isBordered
                as="button"
                className="transition-transform hover:scale-105"
                color="default"
                size="sm"
                src={user?.fotourl || "https://i.pravatar.cc/150?u=default"}
              />
            </DropdownTrigger>
            <DropdownMenu aria-label="Profile Actions" variant="flat">
              <DropdownSection title="Usuário" showDivider>
                <DropdownItem
                  key="profile"
                  className=" gap-2"
                  textValue="Profile"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-semibold">{user?.nome || "Usuário"}</p>
                      <p className="text-sm text-gray-500">
                        {user?.email || "Usuário"}
                      </p>
                      <p className="text-end">{user?.cargo || "Cargo"}</p>
                    </div>
                  </div>
                </DropdownItem>
              </DropdownSection>
              <DropdownSection>
                <DropdownItem
                  key="logout"
                  color="danger"
                  textValue="Logout"
                  onPress={async () => {
                    try {
                      await fetch("/api/logout", { method: "POST" });
                    } catch (e) {
                      // opcional: tratar erro
                    }
                    clearAuth();
                    router.replace("/login");
                    router.refresh();
                  }}
                >
                  <span className="text-danger flex items-center">
                    <ArrowLeftEndOnRectangleIcon className="w-5 h-5 mr-1" />
                    Sair
                  </span>
                </DropdownItem>
              </DropdownSection>
            </DropdownMenu>
          </Dropdown>
        </div>
      </header>
    </>
  );
}
